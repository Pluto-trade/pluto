use anchor_lang::prelude::*;

pub const SYMBOL_MAX_LEN: usize = 16;
pub const ORDER_ID_MAX_LEN: usize = 64;
pub const TRADE_ID_MAX_LEN: usize = 96;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum OrderSide {
    Buy,
    Sell,
}

impl OrderSide {
    pub const SPACE: usize = 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum OrderType {
    Limit,
}

impl OrderType {
    pub const SPACE: usize = 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum OrderStatus {
    Accepted,
    Resting,
    PartiallyFilled,
    Filled,
    Cancelled,
    Rejected,
}

impl OrderStatus {
    pub const SPACE: usize = 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum EscrowStatus {
    Locked,
    PartiallyReleased,
    Released,
    Cancelled,
}

impl EscrowStatus {
    pub const SPACE: usize = 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum SettlementStatus {
    Pending,
    Executed,
    Settled,
    Failed,
}

impl SettlementStatus {
    pub const SPACE: usize = 1;
}

pub const fn string_space(max_len: usize) -> usize {
    4 + max_len
}
