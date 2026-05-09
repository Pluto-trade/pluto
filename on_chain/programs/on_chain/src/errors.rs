use anchor_lang::prelude::*;

#[error_code]
pub enum ExchangeError {
    #[msg("The requested amount must be greater than zero.")]
    InvalidAmount,
    #[msg("Math operation overflowed.")]
    MathOverflow,
    #[msg("The user profile does not match the signer.")]
    InvalidUser,
    #[msg("The token mint does not match the expected account.")]
    InvalidMint,
    #[msg("The token vault does not match the custody vault.")]
    InvalidVault,
    #[msg("The provided string is too long.")]
    StringTooLong,
    #[msg("The exchange is currently paused.")]
    ExchangePaused,
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
    #[msg("The signer is not authorized to perform this exchange action.")]
    UnauthorizedCrank,
}
