"""Seed the database with real-world accreditation standards."""
import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.db import get_db, connect_db, disconnect_db

ISO_21001 = {
    "title": "ISO 21001:2018 - Educational Organizations",
    "code": "ISO-21001",
    "category": "International Standard",
    "description": "Management systems for educational organizations (EOMS) - Requirements with guidance for use.",
    "region": "Global",
    "icon": "Globe",
    "color": "from-blue-600 to-indigo-700",
    "isPublic": True,
    "source": "seeded",
    "criteria": [
        {"title": "4.1", "description": "Understanding the organization and its context"},
        {"title": "4.2", "description": "Understanding needs and expectations of interested parties"},
        {"title": "4.3", "description": "Determining the scope of EOMS"},
        {"title": "5.1", "description": "Leadership and commitment"},
        {"title": "5.2", "description": "Educational policy"},
        {"title": "6.1", "description": "Actions to address risks and opportunities"},
        {"title": "6.2", "description": "Educational objectives and planning"},
        {"title": "7.1", "description": "Resources"},
        {"title": "7.2", "description": "Competence"},
        {"title": "7.3", "description": "Awareness"},
        {"title": "7.4", "description": "Communication"},
        {"title": "8.1", "description": "Operational planning and control"},
        {"title": "8.2", "description": "Requirements for educational products and services"},
        {"title": "8.3", "description": "Design and development of educational products"},
        {"title": "9.1", "description": "Monitoring, measurement, analysis and evaluation"},
        {"title": "9.2", "description": "Internal audit"},
        {"title": "9.3", "description": "Management review"},
        {"title": "10.1", "description": "General (improvement)"},
        {"title": "10.2", "description": "Nonconformity and corrective action"},
        {"title": "10.3", "description": "Continual improvement"},
    ]
}

NCAAA_EGYPT = {
    "title": "NCAAA Institutional Standards - Egypt",
    "code": "NCAAA-EGYPT",
    "category": "National Accreditation",
    "description": "Institutional accreditation standards for higher education in Egypt.",
    "region": "Egypt / Middle East",
    "icon": "Building2",
    "color": "from-emerald-600 to-teal-700",
    "isPublic": True,
    "source": "seeded",
    "criteria": [
        {"title": "Standard 1", "description": "Mission, Vision and Objectives"},
        {"title": "Standard 2", "description": "Governance and Administration"},
        {"title": "Standard 3", "description": "Quality Assurance"},
        {"title": "Standard 4", "description": "Academic Programs"},
        {"title": "Standard 5", "description": "Teaching and Learning"},
        {"title": "Standard 6", "description": "Student Affairs"},
        {"title": "Standard 7", "description": "Faculty"},
        {"title": "Standard 8", "description": "Research"},
        {"title": "Standard 9", "description": "Community Service"},
        {"title": "Standard 10", "description": "Resources"},
        {"title": "Standard 11", "description": "Continuous Improvement"},
    ]
}

async def seed():
    await connect_db()
    db = get_db()
    
    print("Seeding real standards...")
    
    for std_data in [ISO_21001, NCAAA_EGYPT]:
        # Check if exists
        existing = await db.standard.find_first(where={"code": std_data["code"]})
        if existing:
            print(f"Standard {std_data['code']} already exists, skipping...")
            continue
            
        # Create standard
        std = await db.standard.create(
            data={
                "title": std_data["title"],
                "code": std_data["code"],
                "category": std_data["category"],
                "description": std_data["description"],
                "region": std_data["region"],
                "icon": std_data["icon"],
                "color": std_data["color"],
                "isPublic": std_data["isPublic"],
                "source": std_data["source"],
            }
        )
        print(f"Created standard: {std.title}")
        
        # Create criteria
        for crit in std_data["criteria"]:
            await db.criterion.create(
                data={
                    "standardId": std.id,
                    "title": crit["title"],
                    "description": crit["description"],
                }
            )
        print(f"  Added {len(std_data['criteria'])} criteria.")

    await disconnect_db()
    print("Seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed())
