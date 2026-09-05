from pathlib import Path

root = Path(__file__).parent
html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "style.css").read_text(encoding="utf-8")
js = (root / "script.js").read_text(encoding="utf-8")

html = html.replace('<link rel="stylesheet" href="style.css?v=10">', f'<style id="merged-site-styles">\n{css}\n</style>')
html = html.replace('<script src="script.js?v=10"></script>', f'<script id="merged-site-script">\n{js}\n</script>')
(root / "index-merged.html").write_text(html, encoding="utf-8")
print(f"Wrote {root / 'index-merged.html'} ({len(html):,} characters)")
print(f"Inline CSS: {len(css):,} characters; inline JS: {len(js):,} characters")
