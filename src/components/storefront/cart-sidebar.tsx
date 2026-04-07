"use client";

import Image from "next/image";
import { useCartStore } from "@/stores/use-cart-store";
import { formatPrice } from "@/lib/utils";

interface CartSidebarProps {
  storeSlug: string;
  locale: string;
  currency?: string;
}

export function CartSidebar({ storeSlug, locale, currency = "EGP" }: CartSidebarProps) {
  const cartStore = useCartStore(storeSlug);
  const isOpen = cartStore((s) => s.isCartOpen);
  const items = cartStore((s) => s.items);
  const closeCart = cartStore((s) => s.closeCart);
  const removeItem = cartStore((s) => s.removeItem);
  const updateQuantity = cartStore((s) => s.updateQuantity);
  const getTotal = cartStore((s) => s.getTotal);
  const clearCart = cartStore((s) => s.clearCart);

  const total = getTotal();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={closeCart}
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[var(--background)] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Shopping Cart</h2>
            {itemCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-[var(--primary)] text-white rounded-full">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg className="size-20 mb-4 text-[var(--muted-foreground)] opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <p className="text-[var(--muted-foreground)] mb-4">Your cart is empty</p>
              <button
                onClick={closeCart}
                className="px-6 py-2 bg-[var(--primary)] text-white rounded-full font-medium hover:opacity-90 transition-opacity"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 rounded-xl border border-[var(--border)] bg-[var(--background)]"
                >
                  {/* Image */}
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-[var(--muted)] shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <svg className="size-8 text-[var(--muted-foreground)] opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">{item.name}</h3>
                    <p className="text-sm font-semibold text-[var(--primary)]">
                      {formatPrice(item.price, item.currency || currency)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="size-7 flex items-center justify-center rounded-full border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
                      >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="size-7 flex items-center justify-center rounded-full border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
                      >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="self-start p-1 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[var(--border)] p-4 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted-foreground)]">Subtotal</span>
              <span className="font-semibold">{formatPrice(total, currency)}</span>
            </div>

            {/* Shipping Note */}
            <p className="text-xs text-[var(--muted-foreground)] text-center">
              Shipping and taxes calculated at checkout
            </p>

            {/* Buttons */}
            <div className="space-y-2">
              <a
                href={`/${locale}/store/${storeSlug}/checkout`}
                className="flex items-center justify-center w-full py-3 px-6 bg-[var(--primary)] text-white font-semibold rounded-full hover:opacity-90 transition-opacity"
              >
                Checkout
              </a>
              <button
                onClick={clearCart}
                className="flex items-center justify-center w-full py-3 px-6 border border-[var(--border)] text-[var(--foreground)] font-medium rounded-full hover:bg-[var(--muted)] transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
