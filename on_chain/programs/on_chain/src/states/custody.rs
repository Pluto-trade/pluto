use anchor_lang::prelude::*;

#[account]
pub struct CustodyVault {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub token_vault: Pubkey,
    pub total_deposited: u64,
    pub total_withdrawn: u64,
    pub total_locked: u64,
    pub bump: u8,
}

impl CustodyVault {
    pub const SPACE: usize = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 1;
}

#[account]
pub struct UserBalance {
    pub owner: Pubkey,
    pub token_mint: Pubkey,
    pub available_amount: u64,
    pub locked_amount: u64,
    pub deposited_amount: u64,
    pub withdrawn_amount: u64,
    pub bump: u8,
}

impl UserBalance {
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 8 + 8 + 8 + 1;
}
