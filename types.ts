export interface PwaConfig {
  url: string;
  name: string;
  iconUrl: string;
  generated: boolean;
}

export interface ManifestOptions {
  name: string;
  short_name: string;
  start_url: string;
  display: 'standalone';
  background_color: string;
  theme_color: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
  }>;
}
