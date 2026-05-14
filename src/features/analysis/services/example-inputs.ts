import type { AnalysisInputType } from "@/agents/core/types";

export interface ExampleInput {
  id: string;
  title: string;
  inputType: AnalysisInputType;
  rawInput: string;
  note: string;
}

export const exampleInputs: ExampleInput[] = [
  {
    id: "bank-alert",
    title: "Urgent bank verification link",
    inputType: "url",
    rawInput:
      "https://vietcombank-secure-login.support-verification-check.com/confirm?session=urgent",
    note: "Brand impersonation plus an unofficial domain pattern.",
  },
  {
    id: "wallet-payment",
    title: "Off-platform payment request",
    inputType: "payment_text",
    rawInput:
      "Transfer 2,000,000 VND in the next 10 minutes to lock the order. Do not pay through Shopee because the admin system is down. Use this personal bank QR and send the screenshot after payment.",
    note: "Urgency, platform bypass, and a personal bank transfer request.",
  },
  {
    id: "seller-page",
    title: "Cloned seller profile",
    inputType: "seller_text",
    rawInput:
      "Official Apple reseller in Ho Chi Minh City. Inbox only, no comments. Limited stock today. To reserve your iPhone, pay 50% deposit now by bank transfer. New backup page because our old page was locked.",
    note: "Identity ambiguity and deposit pressure.",
  },
  {
    id: "counterfeit-listing",
    title: "Too-good-to-be-true luxury listing",
    inputType: "listing_text",
    rawInput:
      "100% authentic AirPods Pro, flash sale 390,000 VND today only. No returns. Message us for a private checkout link because the marketplace fee is too high.",
    note: "Unrealistic pricing and private checkout diversion.",
  },
  {
    id: "vietcombank-otp-sms",
    title: "Fake Vietcombank OTP SMS",
    inputType: "voice_transcript",
    rawInput:
      "VIETCOMBANK: Your account will be locked in 15 minutes due to unusual access. Read the OTP we just sent to cancel the freeze, or transfer funds to our safe account for verification.",
    note: "Bank impersonation, urgency, OTP pressure, and a safe-account request.",
  },
  {
    id: "government-fine-notice",
    title: "Fake government fine notice",
    inputType: "voice_transcript",
    rawInput:
      "This is the traffic police department. You have an unpaid violation and must pay 3,500,000 VND today to avoid prosecution. Do not visit the office; send payment to this personal account and keep the case private.",
    note: "Government impersonation plus pressure to pay outside official channels.",
  },
  {
    id: "apple-offical-shop",
    title: "Cloned brand shop profile",
    inputType: "shop_profile",
    rawInput:
      "Shop name: Apple Offical Store VN. Account created this week. 100% 5-star reviews: 'good product good seller' repeated across all reviews. iPhone 15 Pro Max new sealed for 8,900,000 VND. Inbox Zalo for bank transfer discount. No returns after payment.",
    note: "Brand-name mimicry, new account, generic reviews, and off-platform payment.",
  },
  {
    id: "too-cheap-marketplace-listing",
    title: "Too-good marketplace seller",
    inputType: "shop_profile",
    rawInput:
      "TikTok Shop seller profile: Samsung Viet Nam Clearance. Galaxy S24 Ultra listed at 5,200,000 VND, limited stock today only. Seller asks buyers to message Telegram for private checkout because platform payment is temporarily unavailable.",
    note: "Unrealistic pricing and private checkout diversion.",
  },
];
