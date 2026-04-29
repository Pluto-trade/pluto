use anchor_lang::prelude::*;

use super::{string_space, SettlementStatus, ORDER_ID_MAX_LEN, SYMBOL_MAX_LEN, TRADE_ID_MAX_LEN};

#[account]
pub struct TradeSettlement {
    pub trade_id: String,
    pub symbol: String,
    pub buy_order_id: String,
    pub sell_order_id: String,
    pub maker_order_id: String,
    pub taker_order_id: String,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub base_mint: Pubkey,
    pub quote_mint: Pubkey,
    pub price: u64,
    pub quantity: u64,
    pub quote_amount: u64,
    pub status: SettlementStatus,
    pub executed_at: i64,
    pub settled_at: i64,
    pub bump: u8,
}

impl TradeSettlement {
    pub const SPACE: usize = 8
+ string_space(TRADE_ID_MAX_LEN)
+ string_space(SYMBOL_MAX_LEN)
+ string_space(ORDER_ID_MAX_LEN)
+ string_space(ORDER_ID_MAX_LEN)
+ string_space(ORDER_ID_MAX_LEN)+ string_space(ORDER_ID_MAX_LEN)
+ 32+ 32+ 32+ 32+ 8+ 8+ 8+ SettlementStatus::SPACE+ 8+ 8+ 1;
}
