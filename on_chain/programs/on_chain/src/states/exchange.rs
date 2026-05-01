use anchor_lang::prelude::*;
#[account]
pub struct ExchangeConfig {
    pub authority: Pubkey,
    pub fee_bps: u16,
    pub order_sequence: u64,
    pub is_paused: bool,
    pub bump: u8,
}
