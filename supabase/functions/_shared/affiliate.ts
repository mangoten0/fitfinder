/**
 * Turns store links into commission links. One network covers thousands of retailers, so we
 * don't need a deal with every store. Which network is set with the AFFILIATE_PROVIDER secret.
 * Check the exact link format in your network dashboard after approval; these are the
 * documented redirect formats at the time of writing.
 */
export type AffiliateConfig = {
  provider: 'skimlinks' | 'sovrn' | 'none';
  /** Skimlinks publisher ID, or Sovrn Commerce API key. */
  id: string | null;
};

export function affiliateConfigFrom(provider: string | undefined, id: string | undefined): AffiliateConfig {
  const normalized = (provider ?? '').trim().toLowerCase();
  const cleanId = id?.trim() || null;
  if ((normalized === 'skimlinks' || normalized === 'sovrn') && cleanId) {
    return { provider: normalized, id: cleanId };
  }
  return { provider: 'none', id: null };
}

export function affiliateUrl(url: string, config: AffiliateConfig): string {
  if (config.provider === 'none' || !config.id) return url;
  const target = encodeURIComponent(url);
  const id = encodeURIComponent(config.id);
  switch (config.provider) {
    case 'skimlinks':
      return `https://go.skimresources.com/?id=${id}&xs=1&url=${target}`;
    case 'sovrn':
      return `https://redirect.viglink.com/?key=${id}&u=${target}`;
  }
}
