source "https://rubygems.org"

# Local development uses plain Jekyll 4 + the plugins below.
# NOTE: GitHub Pages' native build ignores this Gemfile and uses its own
# environment; it honors the whitelisted plugins declared in _config.yml
# (jekyll-seo-tag, jekyll-sitemap, jekyll-feed), so the deployed site matches.
gem "jekyll", "~> 4.4"

group :jekyll_plugins do
  gem "jekyll-seo-tag"
  gem "jekyll-sitemap"
  gem "jekyll-feed"
end

# Timezone data for Windows.
gem "tzinfo-data", platforms: [:windows]

# Ruby 3.4 removed these from the default set; Jekyll's deps need them.
gem "csv"
gem "base64"
gem "bigdecimal"
gem "logger"
