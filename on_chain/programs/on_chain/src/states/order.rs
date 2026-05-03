use anchor_lang::prelude::*;

use super::{string_space, OrderSide, OrderStatus, OrderType, ORDER_ID_MAX_LEN, SYMBOL_MAX_LEN};

#[account]
pub struct OrderState {
    pub owner: Pubkey,
    pub order_id: String,
    pub symbol: String,
    pub side: OrderSide,
    pub order_type: OrderType,
    pub status: OrderStatus,
    pub price: u64,
    pub quantity: u64,
    pub filled_quantity: u64,
    pub remaining_quantity: u64,
    pub sequence_id: u64,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

impl OrderState {
    pub const SPACE: usize = 8+ 32+ string_space(ORDER_ID_MAX_LEN)+string_space(SYMBOL_MAX_LEN)+ OrderSide::SPACE+ OrderType::SPACE+ OrderStatus::SPACE+ 8+ 8 + 8+ 8+ 8+ 8+8+1;
}
