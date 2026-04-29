use anchor_lang::prelude::*;

#[event]
pub struct FundsDeposited {
    pub owner: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub available_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct FundsWithdrawn {
    pub owner: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub available_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct FundsLocked {
    pub owner: Pubkey,
    pub token_mint: Pubkey,
    pub order_id: String,
    pub amount: u64,
    pub locked_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct FundsReleased {
    pub owner: Pubkey,
    pub token_mint: Pubkey,
    pub order_id: String,
    pub amount: u64,
    pub remaining_locked_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct TradeExecuted {
    pub trade_id: String,
    pub symbol: String,
    pub buy_order_id: String,
    pub sell_order_id: String,
    pub maker_order_id: String,
    pub taker_order_id: String,
    pub price: u64,
    pub quantity: u64,
    pub executed_at: i64,
}

#[event]
pub struct BalancesUpdated {
    pub owner: Pubkey,
    pub token_mint: Pubkey,
    pub available_amount: u64,
    pub locked_amount: u64,
    pub timestamp: i64,
}
