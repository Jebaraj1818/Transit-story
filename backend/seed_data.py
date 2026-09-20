"""
Database Seeding Script for The Transit Story.
Safely migrates and seeds the initial content from the existing project data files into MySQL.
Does NOT create duplicate records if run multiple times.
"""

import sys
import os

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import create_app
from backend.db import db
from backend.models import (
    Admin, Category, Destination, DestinationGallery,
    DestinationHighlight, DestinationExperience, Service,
    FAQ, JourneyIdea, SiteSetting, Story
)

app = create_app()

def seed_database():
    with app.app_context():
        print("[SEED] Creating tables if not present...")
        db.create_all()
        
        # ----------------------------------------------------------------------
        # 1. Admin User
        # ----------------------------------------------------------------------
        admin_email = "admin@thetransitstory.com"
        admin = Admin.query.filter_by(email=admin_email).first()
        if not admin:
            admin = Admin(
                name="Curator Desk",
                email=admin_email,
                role="admin"
            )
            admin.set_password("transitstory2026")
            db.session.add(admin)
            print(f"[SEED] Created default admin: {admin_email} (Password: transitstory2026)")
        else:
            print(f"[SEED] Admin user already exists: {admin_email}")

        # ----------------------------------------------------------------------
        # 2. Categories
        # ----------------------------------------------------------------------
        categories_data = [
            {
                'slug': 'cultural-heritage',
                'name': 'Cultural & Heritage',
                'description': 'Ancient Dravidian temple corridors, 19th-century merchant mansions, lost-wax bronze studios, and handloom traditions across Tamil Nadu.',
                'display_order': 1
            },
            {
                'slug': 'college-educational',
                'name': 'College & Educational',
                'description': 'Coordinated student travel for colleges and departments — combining industrial facility visits, science landmarks, and team exploration.',
                'display_order': 2
            },
            {
                'slug': 'leisure-holiday',
                'name': 'Leisure & Holiday',
                'description': 'Misty tea estates in the Nilgiris, quiet pine walks in Kodaikanal, and cascading mountain waterfalls in Courtallam.',
                'display_order': 3
            },
            {
                'slug': 'group-custom',
                'name': 'Group & Custom',
                'description': 'Family gatherings, alumni groups, or custom friend getaways. You decide the destinations and duration; we coordinate the complete logistics.',
                'display_order': 4
            }
        ]
        
        category_map = {}
        for cdata in categories_data:
            cat = Category.query.filter_by(slug=cdata['slug']).first()
            if not cat:
                cat = Category(
                    slug=cdata['slug'],
                    name=cdata['name'],
                    description=cdata['description'],
                    display_order=cdata['display_order'],
                    is_active=True
                )
                db.session.add(cat)
                db.session.flush()
                print(f"[SEED] Added Category: {cat.name}")
            category_map[cdata['slug']] = cat.id

        # ----------------------------------------------------------------------
        # 3. Destinations
        # ----------------------------------------------------------------------
        destinations_data = [
            {
                'slug': 'courtallam',
                'title': 'Courtallam',
                'cat_slug': 'leisure-holiday',
                'location': 'Tenkasi • Tamil Nadu',
                'tag': 'Cascades & Herbal Waters',
                'cover_image': '/images/kutralam-01.webp',
                'hero_image': '/images/kutralam-01.webp',
                'hero_position': 'center 40%',
                'previous_slugs': 'kutralam',
                'gallery': ['/images/kutralam-02.jpg', '/images/kutralam-03.jpg'],
                'description': 'Cascading Western Ghats waterfalls flowing through medicinal forest groves, renowned for cool mountain breezes and revitalizing natural waters.',
                'about': 'Nestled in the lush foothills of the Western Ghats within Tenkasi district, Courtallam is celebrated for its perennial waterfalls and soothing microclimate. Originating in dense herbal forest groves, the mountain streams tumble over stepped granite rocks into natural bathing pools, making it a beloved destination for relaxation, wellness, and scenic nature trails.',
                'experiences': [
                    'Natural bathing in mineral-rich mountain waterfalls and stepped pools',
                    'Morning walks along tranquil forest paths surrounded by Western Ghats ridgelines',
                    'Visiting heritage riverside shrines and quiet local viewpoints overlooking the plains',
                    'Exploring nearby spice groves, village coconut farms, and traditional food stalls'
                ],
                'highlights': [
                    'Multiple cascading falls including Main Falls, Five Falls, and Old Courtallam',
                    'Lush Western Ghats flora, medicinal forest canopy, and refreshing mountain air',
                    'Comfortable access to Tenkasi heritage temples and border scenic routes',
                    'Ideal base for relaxed wellness getaways and gentle nature walks'
                ],
                'suitable_for': 'Family holidays, nature seekers, wellness getaways, and student retreats.',
                'is_educational': False,
                'display_order': 1
            },
            {
                'slug': 'munnar',
                'title': 'Munnar',
                'cat_slug': 'leisure-holiday',
                'location': 'Idukki Highlands • Kerala',
                'tag': 'Tea Valleys & Cloud Ridges',
                'cover_image': '/images/munnar-02.jpg',
                'hero_image': '/images/munnar-02.jpg',
                'hero_position': 'center 45%',
                'gallery': ['/images/munnar-01.webp', '/images/munnar-03.webp', '/images/munnar-04.jpg'],
                'description': 'Rolling carpet of emerald tea estates, mist-laden highland ridges, and serene mountain air in the Western Ghats.',
                'about': 'Situated at the confluence of three mountain streams in the High Ranges of Kerala, Munnar is renowned for vast manicured tea plantations, cool mountain climate, and dramatic cloud-filled valleys. Quiet walking paths trace ancient tea estate bridle paths through cool morning mist and protected shola forest belts.',
                'experiences': [
                    'Walking through single-estate orthodox tea gardens during early morning mist',
                    'Panoramic mountain views across the Anamudi ranges and valley reservoirs',
                    'Discovering colonial tea history and regional highland spice cultivars',
                    'Quiet mountain evenings in heritage plantation bungalows'
                ],
                'highlights': [
                    'Vast expanses of high-altitude tea valleys rolling as far as the eye can see',
                    'Cool mountain climate with fresh alpine air year-round',
                    'Protected shola habitats home to endemic birds and flora',
                    'Unhurried scenic drives through winding Western Ghats mountain passes'
                ],
                'suitable_for': 'Couples, photography enthusiasts, family retreats, and nature lovers.',
                'is_educational': False,
                'display_order': 2
            },
            {
                'slug': 'ooty-nilgiris',
                'title': 'Ooty & Nilgiris',
                'cat_slug': 'leisure-holiday',
                'location': 'Nilgiri Highlands • Tamil Nadu',
                'tag': 'Highland Terroirs & Shola Ridges',
                'cover_image': '/images/ooty-01.jpg',
                'hero_image': '/images/ooty-01.jpg',
                'hero_position': 'center 35%',
                'gallery': ['/images/ooty-02.jpg', '/images/ooty-03.jpg', '/images/ooty-04.jpg'],
                'description': 'Venture past commercial tourist spots into single-estate organic tea walks, quiet Toda hamlets, and mist-covered shola ridges.',
                'about': 'Rising high above the Coimbatore plains, the Nilgiri plateau offers an unhurried highland realm of rolling tea carpets, ancient shola forest pockets, and indigenous heritage. Experience cool mountain air, historic colonial architecture, and protected biosphere trails.',
                'experiences': [
                    'Single-estate organic tea cupping and plantation walks with planters',
                    'Unhurried walks along quiet shola ridges and bird sanctuaries',
                    'Respectful cultural engagement with Toda artisan communities',
                    'Private scenic drives through Kotagiri and Coonoor backroads'
                ],
                'highlights': [
                    'Single-estate orthodox tea processing and tasting',
                    'Native shola-grassland ecology unique to the Nilgiri biosphere',
                    'Peaceful stays away from congested town centers',
                    'Temperate mountain weather year-round'
                ],
                'suitable_for': 'Couples, quiet leisure travelers, nature photographers, and small groups.',
                'is_educational': False,
                'display_order': 3
            },
            {
                'slug': 'kodaikanal',
                'title': 'Kodaikanal',
                'cat_slug': 'leisure-holiday',
                'location': 'Western Ghats • Tamil Nadu',
                'tag': 'Pine Trails & Mist',
                'cover_image': '/images/kodaikanal-01.jpg',
                'hero_image': '/images/kodaikanal-01.jpg',
                'hero_position': 'center 40%',
                'gallery': ['/images/kodaikanal-02.jpg', '/images/kodaikanal-03.jpg', '/images/kodaikanal-04.avif'],
                'description': 'Quiet forest walks, serene lake mornings, and unhurried viewpoints away from crowded thoroughfares.',
                'about': 'Set upon the Palani Hills of Dindigul district, Kodaikanal combines dense pine woods, dramatic cloud-filled valleys, and secluded highland fruit orchards. The Transit Story coordinates private highland transit, serene stays, and bespoke nature walks tailored directly to your requirements.',
                'experiences': [
                    'Sunrise vantage walks overlooking deep cloud-filled valleys',
                    'Canopy walking under century-old pine and eucalyptus forests',
                    'Visits to quiet organic orchards and local artisanal producers',
                    'Unhurried evening lakeside pauses in crisp mountain air'
                ],
                'highlights': [
                    'Scenic high-altitude lake trails and forested paths',
                    'Vast panoramic views toward the southern plains',
                    'Cool highland microclimate with frequent rolling mist',
                    'Curated quiet stays in historic stone cottages and hillside retreats'
                ],
                'suitable_for': 'Highland walkers, family vacations, and unhurried retreats.',
                'is_educational': False,
                'display_order': 4
            },
            {
                'slug': 'kochi-alappuzha',
                'title': 'Kochi & Alappuzha',
                'cat_slug': 'leisure-holiday',
                'location': 'Coast & Waters • Kerala',
                'tag': 'Backwaters & Spice Port',
                'cover_image': '/images/kochi-alappuzha-banner.jpg',
                'hero_image': '/images/kochi-alappuzha-banner.jpg',
                'hero_position': 'center 45%',
                'gallery': ['/images/kochi-alappuzha-01.jpg', '/images/kochi-alappuzha-02.webp', '/images/kochi-alappuzha-03.png'],
                'description': 'Historic colonial maritime quarters, quiet backwater canals, and curated coastal pacing arranged around your preferences.',
                'about': 'Combining the historic spice warehouses and colonial art streets of Fort Kochi with the tranquil canal networks of Alappuzha, this journey brings together seafaring history and slow backwater life. The Transit Story coordinates private transfers, verified boutique stays, and leisurely water exploration tailored entirely to your group.',
                'experiences': [
                    'Heritage walking through Fort Kochi, Mattancherry spice lanes, and colonial avenues',
                    'Private day or sunset canal cruises through the unhurried waterways of Alappuzha',
                    'Local culinary stops featuring authentic regional coastal cooking',
                    'Traditional performance arts and historic architectural visits'
                ],
                'highlights': [
                    'Centuries-old spice trading alleys, churches, and maritime history',
                    'Palm-fringed lagoons and interconnected rural waterways',
                    'Curated private vehicle transit between Kochi and Alappuzha',
                    'Flexible pacing with custom accommodation choices'
                ],
                'suitable_for': 'Culture enthusiasts, slow travelers, couples, and family holidays.',
                'is_educational': False,
                'display_order': 5
            },
            {
                'slug': 'wonderla-kochi',
                'title': 'Wonderla Kochi',
                'cat_slug': 'group-custom',
                'location': 'Kochi • Kerala',
                'tag': 'Recreation & Adventure',
                'cover_image': '/images/wonderla-group-escapes-01.jpg',
                'hero_image': '/images/wonderla-group-escapes-01.jpg',
                'hero_position': 'center 45%',
                'gallery': ['/images/wonderla-group-escapes-02.avif', '/images/wonderla-group-escapes-03.webp', '/images/wonderla-group-escapes-04.avif'],
                'description': 'High-energy recreation, curated group transit, and structured leisure arrangements designed for student batches and family gatherings.',
                'about': 'Situated on the scenic outskirts of Kochi, Wonderla provides expansive recreation zones, water attractions, and open-air entertainment. The Transit Story arranges comfortable group transit, verified stays, and flexible pacing tailored directly around your requirements.',
                'experiences': [
                    'Coordinated private group transport with flexible departure timings',
                    'Full-day leisure access across aquatic and adventure recreation zones',
                    'Reserved group dining coordination and dedicated team assembly points',
                    'Optional extensions to nearby Fort Kochi heritage quarters or coastal spots'
                ],
                'highlights': [
                    'Expansive world-class recreation park on the outskirts of Kochi',
                    'Structured group logistics tailored for students, friends, and family reunions',
                    'Safety-verified private bus or coach transport options',
                    'Seamless travel arrangements without fixed packages or rigid schedules'
                ],
                'suitable_for': 'Student cohorts, youth groups, department trips, and active family holidays.',
                'is_educational': False,
                'display_order': 6
            },
            {
                'slug': 'nellaiyappar-temple',
                'title': 'Nellaiyappar Temple',
                'cat_slug': 'cultural-heritage',
                'location': 'Tirunelveli • Tamil Nadu',
                'tag': 'Sacred Dravidian Heritage',
                'cover_image': '/images/nellaiyappar-temple-02.jpg',
                'hero_image': '/images/nellaiyappar-temple-02.jpg',
                'hero_position': 'center 25%',
                'gallery': ['/images/nellaiyappar-temple-03.jpg', '/images/nellaiyappar-temple-01.jpg', '/images/nellaiyappar-temple-04.jpg'],
                'description': 'Centuries of Dravidian sacred architecture, soaring stone gopurams, musical pillars, and classical legends.',
                'about': 'Standing majestically in the heart of Tirunelveli along the northern banks of the Thamirabarani River, Nellaiappar Temple is an architectural masterpiece celebrated for its intricate pillared halls, musical stone columns, and profound Pandyan-era heritage. The temple complex is one of the largest in Tamil Nadu, preserving centuries of sacred sculpture, ancient bronze iconography, and living ritual traditions.',
                'experiences': [
                    'Acoustical marvel of the hand-carved musical stone pillars vibrating at distinct pitches',
                    'Guided study of the thousand-pillar mandapam and classical Pandyan stone inscriptions',
                    'Morning quiet walks along the sacred banks of the Thamirabarani River',
                    'Tasting authentic Tirunelveli halwa and discovering regional southern culinary crafts'
                ],
                'highlights': [
                    'Towering stone gopurams defining the Tirunelveli skyline across centuries',
                    'Elaborate pillared halls reflecting the height of classical Dravidian stone carving',
                    'Living temple heritage with deep spiritual and community traditions',
                    'Central cultural anchor connecting southern Tamil Nadu heritage itineraries'
                ],
                'suitable_for': 'Heritage enthusiasts, cultural travelers, architecture scholars, and family journeys.',
                'is_educational': False,
                'display_order': 7
            },
            {
                'slug': 'thirumalai-kovil',
                'title': 'Thirumalai Kovil',
                'cat_slug': 'cultural-heritage',
                'location': 'Panpoli • Tenkasi',
                'tag': 'Hill Sanctum & Vistas',
                'cover_image': '/images/thirumalai-kovil-02.jpg',
                'hero_image': '/images/thirumalai-kovil-02.jpg',
                'hero_position': 'center 45%',
                'gallery': ['/images/thirumalai-kovil-01.jpg', '/images/thirumalai-kovil-03.jpg', '/images/thirumalai-kovil-04.jpg'],
                'description': 'A peaceful hillside temple perched above emerald coconut groves with sweeping views toward the Western Ghats.',
                'about': 'Perched atop a gentle rocky hillock in Panpoli near Tenkasi, Thirumalai Kovil commands 360-degree panoramic vistas across emerald green paddy fields, coconut palms, and the majestic ridgelines of the Western Ghats. The hill is caressed by cool mountain breezes flowing through the gaps of the ghats, creating a serene, contemplation-rich sanctuary.',
                'experiences': [
                    'Scenic climb or drive up the winding hill road with widening vistas at every curve',
                    'Unhurried pause at the wind-swept hilltop sanctum surrounded by birds and greenery',
                    'Panoramic landscape photography across coconut plains and Western Ghats spurs',
                    'Connecting easily with nearby Courtallam cascades and Tenkasi heritage shrines'
                ],
                'highlights': [
                    'Breathtaking 360-degree panorama of southern agrarian landscapes and mountain spurs',
                    'Tranquil mountain atmosphere far removed from bustling highway routes',
                    'Perennial mountain breezes flowing through the surrounding Western Ghats gap',
                    'Natural harmony between sacred hill architecture and surrounding farmland'
                ],
                'suitable_for': 'Peaceful day visits, scenic nature photography, and family heritage excursions.',
                'is_educational': False,
                'display_order': 8
            },
            {
                'slug': 'kerala-arts-and-science',
                'title': 'Kerala Arts & Science',
                'cat_slug': 'college-educational',
                'location': 'Kovalam • Thiruvananthapuram',
                'tag': 'Craft Traditions & Design Study',
                'cover_image': '/images/kerala-arts-crafts-village-01.jpg',
                'hero_image': '/images/kerala-arts-crafts-village-01.jpg',
                'hero_position': 'center 35%',
                'gallery': ['/images/kerala-arts-crafts-village-03.jpg', '/images/kerala-arts-crafts-village-02.jpg', '/images/kerala-arts-crafts-village-04.jpg'],
                'description': 'A comprehensive campus immersion into traditional Kerala architecture, vernacular craft pavilions, and living artisan workshops.',
                'about': 'Situated in the tranquil outskirts of Kovalam near Thiruvananthapuram, this extensive campus serves as a cultural and educational sanctuary dedicated to preserving and showcasing Kerala’s traditional craftsmanship. Designed with vernacular architectural idioms, open-air pavilions, and dedicated artisan ateliers, the visit offers student cohorts and institutional groups direct exposure to living craft traditions, material design philosophies, and cultural conservation practices.',
                'experiences': [
                    'Direct observation of master craftsmen working with handloom textiles, terracotta, and bell-metal casting',
                    'Study of vernacular Kerala campus architecture, passive ventilation, and sloped clay-tile roof design',
                    'Exploration of curated craft pavilions illustrating regional material arts and indigenous design heritage',
                    'Field interaction with artisan collectives detailing traditional techniques and contemporary applications'
                ],
                'highlights': [
                    'Living craft ateliers covering traditional handloom, brass casting, and woodwork',
                    'Harmonious open-air campus design nestled within coastal Thiruvananthapuram greenery',
                    'Valuable educational exposure for design, architecture, arts, and humanities students',
                    'Flexible group visit pacing suited for college batches and institutional cohorts'
                ],
                'suitable_for': 'Design academies, architecture faculties, cultural study departments, and student group visits.',
                'is_educational': True,
                'display_order': 9
            },
            {
                'slug': 'koodankulam-nuclear-plant',
                'title': 'Koodankulam Nuclear Plant',
                'cat_slug': 'college-educational',
                'location': 'Koodankulam • Tirunelveli',
                'tag': 'Industrial & Power Engineering',
                'cover_image': '/images/koodankulam-nuclear-plant-01.jpg',
                'hero_image': '/images/koodankulam-nuclear-plant-01.jpg',
                'hero_position': 'center 45%',
                'gallery': ['/images/koodankulam-nuclear-plant-02.avif', '/images/koodankulam-nuclear-plant-03.avif', '/images/koodankulam-nuclear-plant-04.jpg'],
                'description': 'Direct field perspective on one of India’s largest coastal energy installations, massive civil infrastructure, and high-capacity power generation.',
                'about': 'Located along the southern coastline of Tamil Nadu in Tirunelveli district, the Koodankulam installation represents a landmark in large-scale energy infrastructure and modern engineering execution. A dedicated industrial visit offers engineering students and academic cohorts an irreplaceable real-world perspective on mega-scale coastal civil engineering, grid-scale power generation logistics, and regional infrastructure integration.',
                'experiences': [
                    'Visual study of large-scale containment structures and coastal heavy-engineering construction',
                    'Appreciation of grid transmission networks, regional power distribution, and coastal civil engineering',
                    'Field exposure to high-capacity industrial installation layouts and coastal environmental planning',
                    'Connecting educational perspectives with regional geography and South Indian industrial corridors'
                ],
                'highlights': [
                    'One of India’s most prominent civil and energy infrastructure installations',
                    'Real-world context for mechanical, electrical, civil, and energy engineering cohorts',
                    'Scenic southern coastal transit route connecting easily with Tirunelveli and Kanyakumari',
                    'Coordinated group transit logistics tailored to institutional field schedules'
                ],
                'suitable_for': 'Engineering students, polytechnic colleges, technical faculties, and science cohorts.',
                'is_educational': True,
                'display_order': 10
            }
        ]

        dest_id_map = {}
        for ddata in destinations_data:
            dest = Destination.query.filter_by(slug=ddata['slug']).first()
            if not dest:
                cat_id = category_map.get(ddata['cat_slug'])
                dest = Destination(
                    slug=ddata['slug'],
                    title=ddata['title'],
                    category_id=cat_id,
                    location=ddata['location'],
                    tag=ddata['tag'],
                    cover_image=ddata['cover_image'],
                    hero_image=ddata['hero_image'],
                    hero_position=ddata['hero_position'],
                    description=ddata['description'],
                    about=ddata['about'],
                    suitable_for=ddata['suitable_for'],
                    is_educational=ddata['is_educational'],
                    is_published=True,
                    display_order=ddata['display_order']
                )
                db.session.add(dest)
                db.session.flush()
                
                # Add highlights
                for idx, hl in enumerate(ddata['highlights']):
                    db.session.add(DestinationHighlight(destination_id=dest.id, item_text=hl, display_order=idx))
                    
                # Add experiences
                for idx, exp in enumerate(ddata['experiences']):
                    db.session.add(DestinationExperience(destination_id=dest.id, item_text=exp, display_order=idx))
                    
                # Add gallery images (Max 3, strictly distinct from hero)
                for idx, gimg in enumerate(ddata['gallery'][:3]):
                    db.session.add(DestinationGallery(destination_id=dest.id, image_url=gimg, display_order=idx))
                    
                print(f"[SEED] Added Destination: {dest.title}")
            dest_id_map[ddata['slug']] = dest.id

        # ----------------------------------------------------------------------
        # 4. Journey Ideas (Homepage Curated Destinations)
        # ----------------------------------------------------------------------
        # Only the 8 primary leisure / heritage destinations are on the homepage in order
        journey_idea_slugs = [
            'courtallam', 'munnar', 'ooty-nilgiris', 'kodaikanal',
            'kochi-alappuzha', 'wonderla-kochi', 'nellaiyappar-temple', 'thirumalai-kovil'
        ]
        
        for idx, slug in enumerate(journey_idea_slugs):
            did = dest_id_map.get(slug)
            if did:
                existing_idea = JourneyIdea.query.filter_by(destination_id=did).first()
                if not existing_idea:
                    db.session.add(JourneyIdea(destination_id=did, display_order=idx + 1, is_active=True))
                    print(f"[SEED] Added to Homepage Journey Ideas: {slug}")

        # ----------------------------------------------------------------------
        # 5. Services
        # ----------------------------------------------------------------------
        services_data = [
            {
                'slug': 'hotel-booking',
                'eyebrow': 'Accommodations',
                'title': 'Hotel Booking',
                'description': "Accommodation arrangements coordinated around your route and travel preferences — from heritage stays and family hotels to student group lodging and serene backwater houseboats.",
                'points': [
                    'Heritage homestays and boutique lodgings',
                    'Star hotels, family resorts, and guest stays',
                    'Student-friendly group accommodations and dormitories',
                    'Houseboat and coastal stay arrangements'
                ],
                'image': '/images/services/hotel-booking.jpg',
                'is_educational': False,
                'display_order': 1
            },
            {
                'slug': 'transportation',
                'eyebrow': 'Fleet & Transit',
                'title': 'Transportation',
                'description': 'Private vehicle and coach arrangements for individual, family, group, and educational travel as required. Well-maintained vehicles suited to regional South Indian routes.',
                'points': [
                    'AC tourist coaches and passenger buses',
                    'Tempo Travelers and spacious group minivans',
                    'Private sedans and SUVs for family itineraries',
                    'Intercity transfers and station pick-up coordination'
                ],
                'image': '/images/services/transportation.jpg',
                'is_educational': False,
                'display_order': 2
            },
            {
                'slug': 'tour-planning',
                'eyebrow': 'Route & Schedule',
                'title': 'Tour Planning',
                'description': 'Help coordinate destinations, travel requirements, and journey planning. Balanced day-wise schedules crafted around your pacing without rushed stops.',
                'points': [
                    'Day-wise route pacing and transit scheduling',
                    'Destination sequence and timing coordination',
                    'Rest stops and regional food recommendations',
                    'Temple visit hours and local access planning'
                ],
                'image': '/images/services/tour-planning.jpg',
                'is_educational': False,
                'display_order': 3
            },
            {
                'slug': 'college-educational-tours',
                'eyebrow': 'Industrial & Academic Visits',
                'title': 'College & Educational Tours',
                'description': 'Educational and industrial visit arrangements for colleges and student groups. Structured travel combining facility visits, science landmarks, and team exploration.',
                'points': [
                    'Industrial visit and academic site coordination',
                    'Student cohort transportation and group lodging',
                    'Curriculum-aligned technical and cultural exposure',
                    'Itinerary planning tailored to institutional schedules'
                ],
                'image': '/images/kerala-arts-crafts-village-01.jpg',
                'is_educational': True,
                'display_order': 4
            },
            {
                'slug': 'group-travel',
                'eyebrow': 'Family & Collective Travel',
                'title': 'Group Travel',
                'description': 'Travel arrangements for groups based on their requirements. Smooth coordination for extended family gatherings, alumni groups, and community outings.',
                'points': [
                    'Coordinated multi-family and alumni travel',
                    'Comfortable pacing for travelers of all ages',
                    'Group dining and common stay coordination',
                    'Recreation, theme park, and scenic stops'
                ],
                'image': '/images/wonderla-group-escapes-01.jpg',
                'is_educational': False,
                'display_order': 5
            },
            {
                'slug': 'custom-travel',
                'eyebrow': 'Flexible Planning',
                'title': 'Custom Travel Arrangements',
                'description': "Flexible travel planning based on the customer's destination and needs. You communicate the destinations and duration; we coordinate the journey arrangements.",
                'points': [
                    'End-to-end custom itinerary planning',
                    'Freedom to choose preferred circuits and stops',
                    'Flexible vehicle type and lodging combinations',
                    'Direct coordination for unique travel requirements'
                ],
                'image': '/images/kodaikanal-01.jpg',
                'is_educational': False,
                'display_order': 6
            }
        ]

        for sdata in services_data:
            svc = Service.query.filter_by(slug=sdata['slug']).first()
            if not svc:
                svc = Service(
                    slug=sdata['slug'],
                    eyebrow=sdata['eyebrow'],
                    title=sdata['title'],
                    description=sdata['description'],
                    image=sdata['image'],
                    is_educational=sdata['is_educational'],
                    display_order=sdata['display_order'],
                    is_active=True
                )
                svc.set_points(sdata['points'])
                db.session.add(svc)
                print(f"[SEED] Added Service: {svc.title}")

        # ----------------------------------------------------------------------
        # 6. FAQs
        # ----------------------------------------------------------------------
        faqs_data = [
            {
                'question': 'Can I customise my trip?',
                'answer': 'Yes, entirely. Every journey with The Transit Story is arranged around your timeline, group size, and preferred destinations. Rather than selling rigid pre-packaged tours, we build the itinerary and logistics around what you want to experience.',
                'display_order': 1
            },
            {
                'question': 'Do you arrange transportation?',
                'answer': 'Yes. We coordinate dedicated private transport — including comfortable cars, tempo travelers, and tourist buses with verified professional drivers across South India. Whether for intercity travel, local sightseeing, or full multi-day routes, transportation is arranged to match your group size.',
                'display_order': 2
            },
            {
                'question': 'Can you help with hotel bookings and stays?',
                'answer': 'Yes. We coordinate accommodations that match your travel style — from heritage homestays and boutique retreats to star hotels and family-friendly stays. All accommodations are verified for safety, comfort, and hospitality.',
                'display_order': 3
            },
            {
                'question': 'Do you organise college and educational tours?',
                'answer': 'Yes. We coordinate tailored industrial visits (IVs), field immersions, and academic expeditions for college departments, schools, and student batches. We handle fleet buses, student-friendly accommodation, entry permissions, and faculty coordination.',
                'display_order': 4
            },
            {
                'question': 'How can I enquire about a journey?',
                'answer': 'You can submit a journey request through our "Plan Your Journey" form, specifying your preferred destinations, travel dates, group size, and required arrangements. Alternatively, you can reach out via our Contact page or speak directly with our curation desk.',
                'display_order': 5
            },
            {
                'question': 'Are there fixed departure dates or can we choose our own?',
                'answer': 'You choose your own dates. We operate on a bespoke model, so your journey starts whenever you are ready to travel. We advise on optimal seasons and regional timing for specific destinations to ensure the best experience.',
                'display_order': 6
            }
        ]

        for fdata in faqs_data:
            faq = FAQ.query.filter_by(question=fdata['question']).first()
            if not faq:
                db.session.add(FAQ(
                    question=fdata['question'],
                    answer=fdata['answer'],
                    display_order=fdata['display_order'],
                    is_published=True
                ))
                print(f"[SEED] Added FAQ: {fdata['question']}")

        # ----------------------------------------------------------------------
        # 7. Stories
        # ----------------------------------------------------------------------
        stories_data = [
            {
                'slug': 'whispers-of-the-athangudi-tile-makers',
                'title': 'Whispers of the Athangudi Tile-Makers: Geometry, Sand & Glass',
                'category': 'Cultural Immersion',
                'date_label': 'August 2026',
                'read_time': '6 min read',
                'excerpt': 'In a quiet Chettinad village, artisans pour colored cement through handcrafted brass stencils onto glass panes — a living testament to patience and trade winds.',
                'content': 'Under terracotta roofs where shadows soften the afternoon heat, the rhythm of Athangudi unfolds. Unlike industrial ceramic tiles fired in massive kilns, each Athangudi tile is poured cold, layer upon layer, using local river sand, colored cement slurry, and fine glass backings. This is travel unhurried: standing beside Murugan, whose hands remember patterns charted two centuries ago.',
                'image': '/images/nellaiyappar-temple-02.jpg',
                'author': 'Editorial Field Note',
                'display_order': 1
            },
            {
                'slug': 'conversations-with-the-mist-of-kotagiri',
                'title': 'Conversations with the Mist: Sustainable Terroirs in the Blue Mountains',
                'category': 'Offbeat Experiences',
                'date_label': 'July 2026',
                'read_time': '8 min read',
                'excerpt': 'Away from tourist corridors, we sit with third-generation organic tea farmers understanding how microclimates, shade trees, and endemic flora shape true terroir.',
                'content': 'At 1,800 meters above sea level, the western winds push dense cloud blankets through shola forests. Here, tea is not merely a commodity; it is an ecological balance. When travelers walk with local farmers, conversations shift from sightseeing to deep soil health, native honeybees, and preserving indigenous watershed basins.',
                'image': '/images/ooty-01.jpg',
                'author': 'The Transit Story Collective',
                'display_order': 2
            },
            {
                'slug': 'the-rhythm-of-kaveri-swamimalai-bronze',
                'title': 'The Lost-Wax Flame: How Swamimalai Preserves 1,000 Years of Bronze Art',
                'category': 'Intellectual Voyages',
                'date_label': 'June 2026',
                'read_time': '7 min read',
                'excerpt': 'How ancient proportions laid down in canonical Shilpa Shastras continue to shape the golden-hued sacred bronzes of the Kaveri delta.',
                'content': 'In the artisan alleys along the Kaveri riverbed, clay mixed with river silt coats beeswax sculpted figures. Once dried, the wax melts away into fire, making room for molten bronze alloy. This lost-wax technique has survived unbroken since the Chola dynasty, linking today\'s traveler directly to ancient intellectual mastery.',
                'image': '/images/thirumalai-kovil-02.jpg',
                'author': 'Cultural Heritage Dispatch',
                'display_order': 3
            }
        ]

        for sdata in stories_data:
            story = Story.query.filter_by(slug=sdata['slug']).first()
            if not story:
                db.session.add(Story(
                    slug=sdata['slug'],
                    title=sdata['title'],
                    category=sdata['category'],
                    date_label=sdata['date_label'],
                    read_time=sdata['read_time'],
                    excerpt=sdata['excerpt'],
                    content=sdata['content'],
                    image=sdata['image'],
                    author=sdata['author'],
                    is_published=True,
                    display_order=sdata['display_order']
                ))
                print(f"[SEED] Added Story: {sdata['title']}")

        # ----------------------------------------------------------------------
        # 8. Site Settings
        # ----------------------------------------------------------------------
        settings_data = {
            'brand_name': 'The Transit Story',
            'tagline': 'Curated Journeys | Crafted Experiences',
            'contact_phone': '',
            'contact_phone_1': '',
            'contact_phone_2': '',
            'contact_phone_3': '',
            'contact_phone_4': '',
            'contact_email': 'transitstory.in@gmail.com',
            'whatsapp_url': '#',
            'instagram_url': '#',
            'linkedin_url': '#',
            'headquarters': 'Tamil Nadu, South India',
            'working_hours': 'Monday – Saturday, 9:00 AM – 6:00 PM IST',
        }

        for key, val in settings_data.items():
            setting = SiteSetting.query.filter_by(setting_key=key).first()
            if not setting:
                db.session.add(SiteSetting(setting_key=key, setting_value=val))
                print(f"[SEED] Set setting: {key}")

        db.session.commit()
        print("[SEED COMPLETED] Database populated successfully with all existing verified assets and models.")

if __name__ == '__main__':
    seed_database()
