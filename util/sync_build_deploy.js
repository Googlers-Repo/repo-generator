const sync_build_deploy = (baseSitemapUrl) => `
name: sync-build-deploy
on:
  schedule:
    - cron: '0 */6 * * *'
    
  push:
    branches: [ "master" ]
    
  pull_request:
    branches: [ "master" ]

  workflow_dispatch:
   inputs:
      repo_user:
        description: 'Repo Username'
      repo_name:
        description: 'Repo Name'


permissions:
  contents: write
  issues: write
  pull-requests: write
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

env:
  IS_SYNC: \${{ github.event_name == 'schedule' || startsWith(github.event.head_commit.message, '[sync]') }}

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: \${{ github.ref }}

      - name: Checkout util
        uses: actions/checkout@v4
        with:
          repository: Googlers-Repo/magisk-modules-repo-util
          path: util

      - name: Set up Git
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
          cache-dependency-path: '**/requirements.txt'

      - name: Install dependencies
        run: pip install -r util/requirements.txt

      # New added modules
      - name: Add module
        if: \${{ (github.event.inputs.repo_user != '') && (github.event.inputs.repo_name != '') }}
        run: |
          python util/cli.py github --token \${{ secrets.GITHUB_TOKEN }} -u \${{ github.event.inputs.repo_user }} -r \${{ github.event.inputs.repo_name }}

      - name: Commit module
        if: \${{ (github.event.inputs.repo_user != '') && (github.event.inputs.repo_name != '') }}
        run: |
          git add modules
          git commit -sm "[MODULE] \${{ github.event.inputs.repo_name }}" || true
          git push || true
      ####

      - name: Sync
        if: \${{ env.IS_SYNC == 'true' }}
        run: |
          python util/cli.py sync --diff versions_diff.md

      - name: Write versions diff to summary
        if: \${{ env.IS_SYNC == 'true' }}
        run: |
          if [ -f versions_diff.md ]; then
            echo "## Versions Diff" >> $GITHUB_STEP_SUMMARY
            echo "$(cat versions_diff.md)" >> $GITHUB_STEP_SUMMARY
            rm versions_diff.md
          fi
          
      - name: Write latest versions to summary
        if: \${{ env.IS_SYNC != 'true' }}
        run: |
          python util/cli.py index --list > latest_versions.md
          echo "## Latest Versions" >> $GITHUB_STEP_SUMMARY
          echo "$(cat latest_versions.md)" >> $GITHUB_STEP_SUMMARY
          rm latest_versions.md

      - name: Index, Sitemap and Push
        if: \${{ env.IS_SYNC == 'true' }}
        run: |
          ${baseSitemapUrl ? `python util/cli.py sitemap --base-url "${baseSitemapUrl}"` : "# Sitemap excluded"}
          python util/cli.py index --push
          
      - name: Upload logs
        uses: actions/upload-artifact@v3
        with:
          name: logs
          path: log/*.log
  
  build:
    runs-on: ubuntu-latest
    needs: sync
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: \${{ github.ref }}
        
      - name: Setup Pages
        uses: actions/configure-pages@v3
        
      - name: Build with Jekyll
        uses: actions/jekyll-build-pages@v1
        with:
          source: ./
          destination: ./_site
          
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2`;

export { sync_build_deploy };
