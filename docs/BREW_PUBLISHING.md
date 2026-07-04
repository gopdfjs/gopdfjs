# Homebrew Publishing Guide for gopdf-cli

This document outlines how to distribute `gopdf-cli` (alias `gopdf`) through Homebrew, the popular package manager for macOS and Linux.

---

## Strategy 1: Custom Homebrew Tap (Recommended)

Creating a custom Homebrew Tap (e.g., `gopdfjs/gopdf`) provides you with 100% control over the release cycle, requires no third-party reviews, and allows you to instantly publish updates as part of your CI/CD pipeline.

### Step 1: Create the Tap Repository
1. On GitHub, create a new public repository named **`homebrew-tap`** (or **`homebrew-gopdf`**) under the `gopdfjs` organization.
   - *Note: Homebrew repository names must start with `homebrew-` to be tapped using short names.*
2. Users will tap your repository using:
   ```bash
   brew tap gopdfjs/gopdf
   ```

### Step 2: Add the Formula File
Inside your `homebrew-gopdf` repository, create a directory named `Formula/` and create a formula file named `gopdf.rb` (or `gopdf-cli.rb`).

Here is the exact production-ready formula template:

```ruby
class Gopdf < Formula
  desc "Local PDF diagnostics, compression, and OCR tool (WASM + Node)"
  homepage "https://github.com/systembugtj/gopdfjs"
  url "https://registry.npmjs.org/@gopdfjs/pdf-cli/-/@gopdfjs/pdf-cli-0.1.0.tgz"
  sha256 "REPLACE_WITH_TARBALL_SHA256_HASH"
  license "MIT"

  depends_on "node"

  def install
    # Install all dependencies including native binary builds like @napi-rs/canvas
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    # Run a simple diagnostic command to verify installation success
    system "#{bin}/gopdf", "--help"
  end
end
```

### Step 3: User Installation
Once the repository is public and the formula is committed, users can install `gopdf` globally with single commands:

```bash
# Tap and install
brew tap gopdfjs/gopdf
brew install gopdf

# Verify installation
gopdf --help
```

---

## Strategy 2: Official homebrew-core Submission

Submitting to the official Homebrew repository (`homebrew/homebrew-core`) makes your CLI available to millions of developers out-of-the-box without tapping a custom repository. Users can install it directly with: `brew install gopdf`.

### Submission Requirements
To be accepted into `homebrew-core`, your CLI must meet these strict criteria:
1. **Popularity/Notability**: Must have a reasonable number of stars, forks, or organic usage.
2. **Build from Source**: Must build from source and run entirely locally.
3. **Pure Formula Quality**: Must pass all Homebrew linting and style audits (`brew audit --new`).

### Formula Template for `homebrew-core`
Homebrew-core formulas for Node-based tools are typically packaged from npm tarballs using Homebrew's built-in `Language::Node` helpers:

```ruby
require "language/node"

class Gopdf < Formula
  desc "Local PDF diagnostics, compression, and OCR tool (WASM + Node)"
  homepage "https://github.com/systembugtj/gopdfjs"
  url "https://registry.npmjs.org/@gopdfjs/pdf-cli/-/@gopdfjs/pdf-cli-0.1.0.tgz"
  sha256 "REPLACE_WITH_TARBALL_SHA256_HASH"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    # Run simple check to ensure no runtime errors
    assert_match "local PDF tools", shell_output("#{bin}/gopdf --help")
  end
end
```

### Steps to Submit to `homebrew-core`

1. **Verify Formula Locally**:
   ```bash
   # Generate formula skeleton or write the custom gopdf.rb
   brew create https://registry.npmjs.org/@gopdfjs/pdf-cli/-/@gopdfjs/pdf-cli-0.1.0.tgz --node

   # Edit/Replace content with the gopdf.rb template above
   brew edit gopdf
   ```
2. **Test and Audit**:
   ```bash
   # Test installation
   brew install --build-from-source gopdf

   # Run automated formula audits
   brew audit --strict --online gopdf

   # Verify tests
   brew test gopdf
   ```
3. **Submit PR**:
   - Push your new formula to your branch and run:
   ```bash
   brew pull-request --fork --new gopdf
   ```
   - Follow the prompts to automatically fork `homebrew-core` and submit a Pull Request.

---

## Automatic Formula Update (CI/CD Integration)

You can automate formula updates inside your release pipeline (e.g. GitHub Actions) to automatically update the version and `sha256` hash in your Tap repository:

```yaml
- name: Update Homebrew Formula
  uses: mislav/bump-homebrew-formula-action@v3
  with:
    formula-name: gopdf
    homebrew-tap: gopdfjs/homebrew-gopdf
    base-branch: main
    download-url: https://registry.npmjs.org/@gopdfjs/pdf-cli/-/@gopdfjs/pdf-cli-${{ steps.version.outputs.val }}.tgz
  env:
    COMMITTER_TOKEN: ${{ secrets.HOMEBREW_RELEASE_TOKEN }}
```
