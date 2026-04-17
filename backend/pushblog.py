"""
Seed 9 dummy blog rows into Blog table for testing.
Run:
  python pushblog.py
"""
import os
import sqlite3
import json
from datetime import datetime
import random
from datetime import timezone

def resolve_db_path():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.getenv("HNS_DB_PATH")

    candidates = []
    if env_path:
        candidates.append(env_path)
    candidates.extend([
        os.path.join(base_dir, 'instance', 'hns.db'),
        os.path.join(base_dir, 'hns.db'),
    ])

    for path in candidates:
        if os.path.exists(path):
            return path

    checked = "\n - ".join(candidates)
    raise FileNotFoundError(f"Database not found. Checked:\n - {checked}")

def ensure_connection():
    db_path = resolve_db_path()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

TOPICS = [
    {
        'title': 'The Rise of Green Buildings in India',
        'intro': 'Green buildings are transforming the Indian real estate landscape.',
        'sub1': 'What are Green Buildings?',
        'con1': 'Green buildings use eco-friendly materials and energy-efficient designs.',
        'sub2': 'Benefits of Green Buildings',
        'con2': 'They reduce energy costs and improve occupant health.',
        'sub3': 'Future Trends',
        'con3': 'Expect more government incentives and smart technologies.',
        'meta': 'Green buildings, eco-friendly, real estate India',
        'keywords': 'green, eco, real estate',
        'slug': 'green-buildings-india',
        'featured_alt': 'Green building in India',
    },
    {
        'title': 'How to Choose the Right Property in Mumbai',
        'intro': 'Mumbai offers diverse property options for buyers.',
        'sub1': 'Location Matters',
        'con1': 'Proximity to schools, offices, and transport is key.',
        'sub2': 'Budget Planning',
        'con2': 'Set a realistic budget and explore financing options.',
        'sub3': 'Legal Checks',
        'con3': 'Verify property documents and builder reputation.',
        'meta': 'Property buying, Mumbai, real estate tips',
        'keywords': 'property, Mumbai, tips',
        'slug': 'choose-property-mumbai',
        'featured_alt': 'Mumbai skyline',
    },
    {
        'title': 'Understanding RERA and Its Impact',
        'intro': 'RERA has brought transparency to Indian real estate.',
        'sub1': 'What is RERA?',
        'con1': 'RERA is a regulatory act for real estate projects.',
        'sub2': 'Benefits for Buyers',
        'con2': 'Buyers get timely delivery and legal protection.',
        'sub3': 'Challenges for Builders',
        'con3': 'Builders must comply with strict guidelines.',
        'meta': 'RERA, real estate law, India',
        'keywords': 'RERA, law, real estate',
        'slug': 'rera-impact-india',
        'featured_alt': 'RERA document',
    },
    {
        'title': 'Top 5 Residential Projects in Thane',
        'intro': 'Thane is emerging as a residential hotspot.',
        'sub1': 'Project 1: Lakeview Residency',
        'con1': 'Offers lake-facing apartments with modern amenities.',
        'sub2': 'Project 2: Green Acres',
        'con2': 'Eco-friendly homes with lush gardens.',
        'sub3': 'Project 3: Urban Heights',
        'con3': 'High-rise towers with city views.',
        'meta': 'Thane, residential projects, top 5',
        'keywords': 'Thane, projects, residential',
        'slug': 'top-projects-thane',
        'featured_alt': 'Thane residential project',
    },
    {
        'title': 'Home Loan Tips for First-Time Buyers',
        'intro': 'Getting a home loan can be daunting for new buyers.',
        'sub1': 'Check Eligibility',
        'con1': 'Banks assess income, credit score, and documents.',
        'sub2': 'Compare Interest Rates',
        'con2': 'Shop around for the best rates and terms.',
        'sub3': 'Understand Repayment',
        'con3': 'Choose a tenure that suits your finances.',
        'meta': 'Home loan, first-time buyer, tips',
        'keywords': 'loan, home, buyer',
        'slug': 'home-loan-tips',
        'featured_alt': 'Home loan documents',
    },
    {
        'title': 'Smart Home Technology Trends',
        'intro': 'Smart homes are changing the way we live.',
        'sub1': 'Popular Devices',
        'con1': 'Smart lights, thermostats, and security systems.',
        'sub2': 'Integration',
        'con2': 'Devices can be controlled via mobile apps.',
        'sub3': 'Future Innovations',
        'con3': 'AI and IoT will drive new features.',
        'meta': 'Smart home, technology, trends',
        'keywords': 'smart, home, tech',
        'slug': 'smart-home-trends',
        'featured_alt': 'Smart home devices',
    },
    {
        'title': 'Vastu Shastra: Ancient Wisdom for Modern Homes',
        'intro': 'Vastu Shastra guides home design for harmony.',
        'sub1': 'Principles of Vastu',
        'con1': 'Focuses on directions, layout, and energy flow.',
        'sub2': 'Common Myths',
        'con2': 'Not all rules are mandatory for good living.',
        'sub3': 'Practical Tips',
        'con3': 'Simple changes can improve positivity.',
        'meta': 'Vastu, home design, ancient wisdom',
        'keywords': 'vastu, home, design',
        'slug': 'vastu-shastra-homes',
        'featured_alt': 'Vastu home layout',
    },
    {
        'title': 'Rental Market Trends in 2025',
        'intro': 'The rental market is evolving with new demands.',
        'sub1': 'Demand Drivers',
        'con1': 'Remote work and urban migration boost rentals.',
        'sub2': 'Popular Locations',
        'con2': 'Metro cities see highest rental growth.',
        'sub3': 'Tips for Tenants',
        'con3': 'Negotiate rent and check agreements.',
        'meta': 'Rental market, trends, 2025',
        'keywords': 'rental, market, 2025',
        'slug': 'rental-trends-2025',
        'featured_alt': 'Rental agreement',
    },
    {
        'title': 'Interior Design Ideas for Small Spaces',
        'intro': 'Maximize your small home with smart design.',
        'sub1': 'Use of Colors',
        'con1': 'Light colors make rooms look bigger.',
        'sub2': 'Multi-functional Furniture',
        'con2': 'Sofas with storage, foldable tables.',
        'sub3': 'Lighting',
        'con3': 'Good lighting enhances space perception.',
        'meta': 'Interior design, small spaces, ideas',
        'keywords': 'interior, design, small',
        'slug': 'interior-small-spaces',
        'featured_alt': 'Small space interior',
    },
]

def build_blog_rows(n=9):
    rows = []
    for i in range(n):
        topic = TOPICS[i % len(TOPICS)]
        rows.append({
            'title': topic['title'],
            'intro_paragraph': topic['intro'],
            'subheading1': topic['sub1'],
            'content1': topic['con1'],
            'image1': 'backend/uploads/generated-image_1.png',
            'alt_text1': topic['title'] + ' image 1',
            'subheading2': topic['sub2'],
            'content2': topic['con2'],
            'image2': 'backend/uploads/generated-image_2.png',
            'alt_text2': topic['title'] + ' image 2',
            'subheading3': topic['sub3'],
            'content3': topic['con3'],
            'image3': None,
            'alt_text3': topic['title'] + ' image 3',
            'featured_image': 'backend/uploads/generate_image.png',
            'featured_image_alt': topic['featured_alt'],
            'interlinks': json.dumps([f'/blog/{random.randint(1,20)}' for _ in range(3)]),
            'external_links': json.dumps([f'https://example.com/{random.randint(1,100)}', f'https://external.com/{random.randint(1,100)}']),
            'meta_description': topic['meta'],
            'focus_keywords': topic['keywords'],
            'slug': topic['slug'] + f'-{random.randint(1000,9999)}',
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'),
            'updated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'),
        })
    return rows

def insert_blog_rows(conn, rows):
    cols = [
        'title', 'intro_paragraph', 'subheading1', 'content1', 'image1', 'alt_text1',
        'subheading2', 'content2', 'image2', 'alt_text2', 'subheading3', 'content3',
        'image3', 'alt_text3', 'featured_image', 'featured_image_alt', 'interlinks',
        'external_links', 'meta_description', 'focus_keywords', 'slug', 'created_at', 'updated_at'
    ]
    placeholders = ','.join(['?' for _ in cols])
    sql = f"INSERT INTO Blog ({', '.join(cols)}) VALUES ({placeholders})"
    cur = conn.cursor()
    inserted = 0
    for row in rows:
        try:
            cur.execute(sql, [row[c] for c in cols])
            inserted += 1
        except sqlite3.IntegrityError as e:
            print(f"[skip] {e}")
            continue
    conn.commit()
    return inserted

def main():
    conn = ensure_connection()
    try:
        rows = build_blog_rows(9)
        inserted = insert_blog_rows(conn, rows)
        print(f"Inserted {inserted} random blog rows into Blog table.")
    finally:
        conn.close()

if __name__ == "__main__":
    main()