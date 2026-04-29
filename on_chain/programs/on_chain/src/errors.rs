use anchor_lang::prelude::*;

#[error_code]
pub enum ExchangeError {
    #[msg("The requested amount must be greater than zero.")]
    InvalidAmount,
    #[msg("The account does not have enough available balance.")]
    InsufficientAvailableBalance,
    #[msg("The account does not have enough locked balance.")]
    InsufficientLockedBalance,
    #[msg("The order cannot be settled from its current state.")]
    InvalidOrderStatus,
    #[msg("The escrow position cannot be updated from its current state.")]
    InvalidEscrowStatus,
    #[msg("The settlement cannot be updated from its current state.")]
    InvalidSettlementStatus,
}
