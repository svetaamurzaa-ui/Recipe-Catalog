import os
from service import RecipeService

SITEMAP_REGISTRY = [
    "https://klopotenko.com/post-sitemap.xml",
    "https://www.picante-cooking.com/sitemap.xml",
    "https://cookery.com.ua/post-sitemap.xml",
    "https://www.recipetineats.com/post-sitemap.xml",
    "https://www.budgetbytes.com/post-sitemap.xml",
    "https://www.gimmesomeoven.com/post-sitemap.xml",
    "https://minimalistbaker.com/post-sitemap.xml"
]

def main():
    print("[INFO] Initializing industrial batch parsing conveyor...")
    
    service = RecipeService(max_workers=12, density_file="density.js")
    aggregated_urls = []
    
    print(f"[INFO] Target map index contains {len(SITEMAP_REGISTRY)} nodes.")
    for sitemap_url in SITEMAP_REGISTRY:
        print(f"[INFO] Scanning network node: {sitemap_url}")
        urls = service.parser.extract_urls_from_sitemap(sitemap_url)
        
        clean_urls = [u for u in urls if not any(x in u for x in ["/category/", "/tag/", "/author/", "/page/", "-sitemap"])]
        aggregated_urls.extend(clean_urls)
        
    unique_urls = list(set(aggregated_urls))
    total_discovered = len(unique_urls)
    print(f"[INFO] Aggregation complete. Total unique post links detected: {total_discovered}")
    
    if total_discovered == 0:
        print("[ERROR] Array is empty. Queue processing aborted.")
        return

    MAX_RECIPES_PER_RUN = 15
    execution_batch = unique_urls[:MAX_RECIPES_PER_RUN]
    
    print(f"[INFO] Spawning worker threads for the first chunk of {len(execution_batch)} units...")
    service.parse_multiple_recipes(execution_batch)
    
    output_filename = "global_recipes_database.json"
    if service.save_and_merge_to_json(output_filename):
        print(f"[INFO] Master records updated in: {os.path.abspath(output_filename)}")

if __name__ == "__main__":
    main()