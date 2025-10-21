// Asterdex Trading Bot - TypeScript implementation
// Handles leverage trading, order placement, and position management

export interface TradeOrder {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  reduceOnly?: boolean;
}

export interface Position {
  symbol: string;
  positionAmt: number;
  entryPrice: number;
  markPrice: number;
  unRealizedProfit: number;
  leverage: number;
  marginType: string;
}

export interface Balance {
  asset: string;
  balance: number;
  availableBalance: number;
  crossWalletBalance: number;
  crossUnPnl: number;
}

export class AsterdexTrader {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private offsetMs: number = -2500; // Even more conservative offset (2.5 seconds back)
  private retryCount: number = 0;
  private maxRetries: number = 1; // Reduce retries to avoid rate limits
  private lastSyncTime: number = 0;
  private syncCooldown: number = 60000; // 60 seconds between syncs to avoid rate limits

  constructor(apiKey: string, apiSecret: string, testnet: boolean = false) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = 'https://fapi.asterdex.com';
    // Don't sync on initialization to avoid too many requests
    console.log('AsterdexTrader initialized with conservative offset:', this.offsetMs);
  }

  // Helper to get symbol precision
  private getSymbolPrecision(symbol: string): number {
    const precisions: Record<string, number> = {
      'BTCUSDT': 1,
      'ETHUSDT': 2,
      'BNBUSDT': 2,
      'SOLUSDT': 2,
      'XRPUSDT': 4,
      'DOGEUSDT': 5,
      'ADAUSDT': 4,
      'AVAXUSDT': 3,
      'DOTUSDT': 3,
      'MATICUSDT': 4,
    };
    return precisions[symbol] || 2;
  }

  /**
   * Synchronize with server time (with cooldown to prevent rate limiting)
   */
  async syncTime(): Promise<void> {
    const now = Date.now();
    
    // Skip if synced recently (within cooldown period)
    if (now - this.lastSyncTime < this.syncCooldown) {
      console.log(`Time sync skipped (cooldown active, last sync ${Math.floor((now - this.lastSyncTime) / 1000)}s ago)`);
      return;
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/fapi/v1/time`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }
      
      const data = JSON.parse(text);
      const serverTime = data.serverTime;
      const localTime = Date.now();
      this.offsetMs = serverTime - localTime;
      this.lastSyncTime = now;
      console.log(`Time synchronized. Offset: ${this.offsetMs}ms`);
    } catch (error: any) {
      console.warn('Time sync failed:', error.message);
      // If sync fails, use a very conservative offset
      this.offsetMs = -2500; // 2.5 seconds back to be safe
      console.log('Using fallback offset:', this.offsetMs);
    }
  }

  /**
   * Get properly synchronized timestamp
   */
  private timestamp(): number {
    // Use an even larger cushion to handle clock drift
    return Date.now() + this.offsetMs; // offsetMs already includes cushion
  }

  /**
   * Generate HMAC signature using Web Crypto API
   */
  private async sign(queryString: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.apiSecret);
    const messageData = encoder.encode(queryString);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Make authenticated API request
   */
  private async request(
    method: string,
    path: string,
    params: Record<string, any> = {},
    signed: boolean = true
  ): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const requestParams = { ...params };

    if (signed) {
      requestParams.timestamp = this.timestamp();
      if (!requestParams.recvWindow) {
        requestParams.recvWindow = 60000; // Increase receive window to 60 seconds
      }
    }

    const queryString = new URLSearchParams(requestParams).toString();
    const signature = signed ? await this.sign(queryString) : '';
    const fullQueryString = signed ? `${queryString}&signature=${signature}` : queryString;

    const headers: Record<string, string> = {
      'X-MBX-APIKEY': this.apiKey,
    };

    try {
      const response = await fetch(
        method === 'GET' || method === 'DELETE'
          ? `${url}?${fullQueryString}`
          : url,
        {
          method,
          headers:
            method === 'POST' || method === 'PUT'
              ? { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' }
              : headers,
          body: method === 'POST' || method === 'PUT' ? fullQueryString : undefined,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        
        // Auto-resync on timestamp error (with retry limit)
        if (errorText.includes('-1021') && this.retryCount < this.maxRetries) {
          console.log(`🔄 Timestamp error, resyncing... (attempt ${this.retryCount + 1}/${this.maxRetries})`);
          this.retryCount++;
          await this.syncTime();
          // Retry without timestamp
          const retryParams = Object.fromEntries(
            Object.entries(params).filter(([k]) => k !== 'timestamp' && k !== 'signature')
          );
          const result = await this.request(method, path, retryParams, signed);
          this.retryCount = 0; // Reset on success
          return result;
        }

        this.retryCount = 0; // Reset retry count
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }
      
      this.retryCount = 0; // Reset on success

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // ========== ACCOUNT METHODS ==========

  async getAccountInfo(): Promise<any> {
    console.log('Fetching account information...');
    return this.request('GET', '/fapi/v1/account');
  }

  async getFuturesBalance(): Promise<Balance[]> {
    console.log('Fetching futures balances...');
    return this.request('GET', '/fapi/v2/balance');
  }

  async getBalance(currency?: string): Promise<any> {
    const balances = await this.getFuturesBalance();

    if (currency) {
      const balance = balances.find((b) => b.asset === currency);
      return balance || { asset: currency, balance: 0, availableBalance: 0 };
    }

    return balances.reduce((acc, bal) => {
      acc[bal.asset] = bal;
      return acc;
    }, {} as Record<string, Balance>);
  }

  // ========== MARGIN & LEVERAGE METHODS ==========

  async setMarginType(symbol: string, marginType: 'ISOLATED' | 'CROSSED'): Promise<any> {
    console.log(`Setting margin type for ${symbol} to ${marginType}`);
    return this.request('POST', '/fapi/v1/marginType', {
      symbol,
      marginType,
    });
  }

  async setLeverage(symbol: string, leverage: number): Promise<any> {
    // Common supported leverage values: 1, 2, 3, 5, 10, 15, 20, 25, 50, 75, 100, 125
    const supportedLeverages = [1, 2, 3, 5, 10, 15, 20, 25, 50, 75, 100, 125];
    if (!supportedLeverages.includes(leverage)) {
      console.warn(`Leverage ${leverage}x may not be supported. Common values: ${supportedLeverages.join(', ')}`);
    }
    if (leverage < 1 || leverage > 125) {
      throw new Error('Leverage must be between 1 and 125');
    }

    console.log(`Setting leverage for ${symbol} to ${leverage}x`);
    return this.request('POST', '/fapi/v1/leverage', { symbol, leverage });
  }

  // ========== TRADING METHODS ==========

  async placeOrder(order: TradeOrder): Promise<any> {
    const params: Record<string, any> = {
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quantity: order.quantity.toString(),
    };

    // Get proper price precision for the symbol
    const precision = this.getSymbolPrecision(order.symbol);

    if (order.type === 'LIMIT' || order.type === 'STOP_LIMIT') {
      params.timeInForce = order.timeInForce || 'GTC';
      if (order.price) {
        params.price = order.price.toFixed(precision);
      }
    }

    if (order.type === 'STOP_MARKET' || order.type === 'STOP_LIMIT') {
      if (order.stopPrice) {
        params.stopPrice = order.stopPrice.toFixed(precision);
      }
    }

    if (order.reduceOnly) {
      params.reduceOnly = true;
    }

    console.log(`Placing ${order.type} ${order.side} order for ${order.quantity} ${order.symbol}`);
    return this.request('POST', '/fapi/v1/order', params);
  }

  async marketBuy(symbol: string, quantity: number): Promise<any> {
    return this.placeOrder({ symbol, side: 'BUY', type: 'MARKET', quantity });
  }

  async marketSell(symbol: string, quantity: number): Promise<any> {
    return this.placeOrder({ symbol, side: 'SELL', type: 'MARKET', quantity });
  }

  async limitBuy(symbol: string, quantity: number, price: number): Promise<any> {
    return this.placeOrder({ symbol, side: 'BUY', type: 'LIMIT', quantity, price });
  }

  async limitSell(symbol: string, quantity: number, price: number): Promise<any> {
    return this.placeOrder({ symbol, side: 'SELL', type: 'LIMIT', quantity, price });
  }

  async cancelOrder(symbol: string, orderId: string): Promise<any> {
    console.log(`Canceling order ${orderId} for ${symbol}`);
    return this.request('DELETE', '/fapi/v1/order', { symbol, orderId });
  }

  async cancelAllOrders(symbol?: string): Promise<any> {
    console.log(`Canceling all orders${symbol ? ` for ${symbol}` : ''}`);
    const params = symbol ? { symbol } : {};
    return this.request('DELETE', '/fapi/v1/allOpenOrders', params);
  }

  async getOpenOrders(symbol?: string): Promise<any[]> {
    const params = symbol ? { symbol } : {};
    return this.request('GET', '/fapi/v1/openOrders', params);
  }

  // ========== POSITION METHODS ==========

  async getPositions(symbol?: string): Promise<Position[]> {
    const params = symbol ? { symbol } : {};
    return this.request('GET', '/fapi/v1/positionRisk', params);
  }

  async closePosition(symbol: string): Promise<any> {
    const positions = await this.getPositions(symbol);
    const position = Array.isArray(positions) ? positions[0] : positions;

    if (!position || parseFloat(position.positionAmt) === 0) {
      console.warn(`No open position for ${symbol}`);
      return { status: 'No position to close' };
    }

    const positionAmt = parseFloat(position.positionAmt);
    const side = positionAmt > 0 ? 'SELL' : 'BUY';
    const quantity = Math.abs(positionAmt);

    console.log(`Closing position for ${symbol}: ${quantity}`);
    return this.placeOrder({ symbol, side, type: 'MARKET', quantity, reduceOnly: true });
  }

  async setStopLoss(symbol: string, stopPrice: number, quantity?: number): Promise<any> {
    const positions = await this.getPositions(symbol);
    const position = Array.isArray(positions) ? positions[0] : positions;

    if (!position) {
      throw new Error(`No open position for ${symbol}`);
    }

    const positionAmt = parseFloat(position.positionAmt);
    const side = positionAmt > 0 ? 'SELL' : 'BUY';
    const qty = quantity || Math.abs(positionAmt);

    return this.placeOrder({
      symbol,
      side,
      type: 'STOP_MARKET',
      quantity: qty,
      stopPrice,
      reduceOnly: true,
    });
  }

  async setTakeProfit(symbol: string, takeProfitPrice: number, quantity?: number): Promise<any> {
    const positions = await this.getPositions(symbol);
    const position = Array.isArray(positions) ? positions[0] : positions;

    if (!position) {
      throw new Error(`No open position for ${symbol}`);
    }

    const positionAmt = parseFloat(position.positionAmt);
    const side = positionAmt > 0 ? 'SELL' : 'BUY';
    const qty = quantity || Math.abs(positionAmt);

    return this.placeOrder({
      symbol,
      side,
      type: 'LIMIT',
      quantity: qty,
      price: takeProfitPrice,
      reduceOnly: true,
    });
  }

  // ========== MARKET DATA METHODS ==========

  async getLastPrice(symbol: string): Promise<number> {
    const data = await this.request('GET', '/fapi/v1/ticker/price', { symbol }, false);
    return parseFloat(data.price);
  }

  async getTicker(symbol: string): Promise<any> {
    return this.request('GET', '/fapi/v1/ticker/24hr', { symbol }, false);
  }

  async getOrderbook(symbol: string, limit: number = 20): Promise<any> {
    return this.request('GET', '/fapi/v1/depth', { symbol, limit }, false);
  }

  async testConnectivity(): Promise<boolean> {
    try {
      await this.request('GET', '/fapi/v1/ping', {}, false);
      console.log('API connectivity test successful');
      return true;
    } catch (error) {
      console.error('API connectivity test failed:', error);
      return false;
    }
  }

  async getExchangeInfo(): Promise<any> {
    return this.request('GET', '/fapi/v1/exchangeInfo', {}, false);
  }

  /**
   * Get symbol precision and filters
   */
  async getSymbolInfo(symbol: string): Promise<any> {
    const exchangeInfo = await this.getExchangeInfo();
    const symbolInfo = exchangeInfo.symbols.find((s: any) => s.symbol === symbol);
    
    if (!symbolInfo) {
      throw new Error(`Symbol ${symbol} not found`);
    }

    // Get precision from filters
    const lotSizeFilter = symbolInfo.filters.find((f: any) => f.filterType === 'LOT_SIZE');
    const priceFilter = symbolInfo.filters.find((f: any) => f.filterType === 'PRICE_FILTER');

    return {
      symbol,
      quantityPrecision: symbolInfo.quantityPrecision,
      pricePrecision: symbolInfo.pricePrecision,
      stepSize: lotSizeFilter?.stepSize || '0.001',
      minQty: lotSizeFilter?.minQty || '0.001',
      tickSize: priceFilter?.tickSize || '0.01',
    };
  }

  /**
   * Normalize quantity to exchange precision
   */
  normalizeQuantity(quantity: number, stepSize: string): number {
    const precision = stepSize.indexOf('1') - 1;
    const multiplier = Math.pow(10, precision);
    return Math.floor(quantity * multiplier) / multiplier;
  }

  /**
   * Calculate quantity for a USD notional value
   */
  async calculateQuantity(symbol: string, usdAmount: number, price: number): Promise<number> {
    const info = await this.getSymbolInfo(symbol);
    const rawQuantity = usdAmount / price;
    const normalized = this.normalizeQuantity(rawQuantity, info.stepSize);
    
    console.log(`Quantity calc: raw=${rawQuantity.toFixed(8)}, normalized=${normalized}, stepSize=${info.stepSize}`);
    
    return normalized;
  }
}

// Risk Management Utilities
export function calculatePositionSize(
  accountBalance: number,
  riskPercentage: number,
  entryPrice: number,
  stopLossPrice: number
): number {
  const riskAmount = accountBalance * (riskPercentage / 100);
  const priceDifference = Math.abs(entryPrice - stopLossPrice);
  return riskAmount / priceDifference;
}

export function calculatePnL(
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  side: 'BUY' | 'SELL',
  leverage: number = 1
): number {
  if (side === 'BUY') {
    return (exitPrice - entryPrice) * quantity * leverage;
  } else {
    return (entryPrice - exitPrice) * quantity * leverage;
  }
}

