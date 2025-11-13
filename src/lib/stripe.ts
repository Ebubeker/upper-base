import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
  typescript: true,
});

export async function createStripeProduct(
  name: string,
  description?: string
): Promise<Stripe.Product> {
  return await stripe.products.create({
    name,
    description: description || "",
  });
}

export async function createStripePrice(
  productId: string,
  amount: number
): Promise<Stripe.Price> {
  return await stripe.prices.create({
    product: productId,
    unit_amount: amount,
    currency: "usd",
    recurring: {
      interval: "month",
    },
  });
}

export async function createStripeConnectAccount(
  email: string
): Promise<Stripe.Account> {
  return await stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
}

export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
): Promise<Stripe.AccountLink> {
  return await stripe.accountLinks.create({
    account: accountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: "account_onboarding",
  });
}
