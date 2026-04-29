use anchor_lang::prelude::*;

use super::{string_space, EscrowStatus, OrderSide, ORDER_ID_MAX_LEN};

#[account]
pub struct EscrowPosition {
    pub owner: Pubkey,
    pub token_mint: Pubkey,
    pub order_id: String,
    pub side: OrderSide,
    pub status: EscrowStatus,
    pub locked_amount: u64,
    pub released_amount: u64,
    pub cancelled_amount: u64,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

impl EscrowPosition {
    pub const SPACE: usize = 8+ 32+ 32+ string_space(ORDER_ID_MAX_LEN)+OrderSide::SPACE+ EscrowStatus::SPACE+ 8 + 8+ 8+ 8+ 8+ 1;
}
