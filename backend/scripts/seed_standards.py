import asyncio
import os
import sys

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from prisma import Prisma
from app.core.config import settings

async def main():
    db = Prisma()
    await db.connect()

    print("Cleaning existing standards...")
    # This will cascade to criteria as well
    await db.standard.delete_many()

    standards_data = [
        {
            "id": "ncaaa",
            "title": "NCAAA Standards",
            "code": "NCAAA-2024",
            "category": "Higher Education",
            "description": "National Commission for Academic Accreditation and Assessment standards for Saudi Arabian universities and colleges.",
            "region": "Saudi Arabia",
            "icon": "GraduationCap",
            "color": "from-emerald-600 to-teal-600",
            "features": ["Institutional Effectiveness", "Learning Resources", "Research Standards", "Community Engagement"],
            "estimatedSetup": "2-3 days",
            "criteria_count": 11
        },
        {
            "id": "iso21001",
            "title": "ISO 21001:2018",
            "code": "ISO-21001",
            "category": "International",
            "description": "Educational organizations management systems. International standard for educational management excellence.",
            "region": "International",
            "icon": "Globe",
            "color": "from-blue-600 to-indigo-600",
            "features": ["Learner-Centered Approach", "Lifelong Learning", "Social Responsibility", "Customized Learning"],
            "estimatedSetup": "5-7 days",
            "criteria_count": 42
        },
        {
            "id": "advanced",
            "title": "AdvancED Standards",
            "code": "ADV-ED",
            "category": "K-12 Education",
            "description": "Comprehensive K-12 accreditation standards used by 40,000+ institutions across 80 countries.",
            "region": "Global",
            "icon": "Building2",
            "color": "from-amber-600 to-orange-600",
            "features": ["Leadership Capacity", "Learning Progress", "Resource Utilization", "Stakeholder Engagement"],
            "estimatedSetup": "3-5 days",
            "criteria_count": 31
        },
        {
            "id": "moe",
            "title": "Ministry of Education UAE",
            "code": "MOE-UAE",
            "category": "Government Framework",
            "description": "United Arab Emirates Ministry of Education standards for institutional licensing and accreditation.",
            "region": "UAE",
            "icon": "Shield",
            "color": "from-rose-600 to-pink-600",
            "features": ["Quality Assurance", "Student Welfare", "Academic Programs", "Faculty Standards"],
            "estimatedSetup": "2-4 days",
            "criteria_count": 18
        },
        {
            "id": "qaa",
            "title": "QAA UK Standards",
            "code": "QAA-UK",
            "category": "Higher Education",
            "description": "Quality Assurance Agency for Higher Education standards used across UK universities.",
            "region": "United Kingdom",
            "icon": "Award",
            "color": "from-purple-600 to-violet-600",
            "features": ["Academic Standards", "Quality Enhancement", "Student Voice", "Research Integrity"],
            "estimatedSetup": "4-6 days",
            "criteria_count": 28
        },
        {
            "id": "naqaa",
            "title": "NAQAAE Egypt",
            "code": "NAQAAE-EG",
            "category": "National Authority",
            "description": "National Authority for Quality Assurance and Accreditation of Education framework for Egyptian institutions.",
            "region": "Egypt",
            "icon": "FileCheck",
            "color": "from-cyan-600 to-blue-600",
            "features": ["Institutional Mission", "Governance Structure", "Educational Programs", "Assessment Systems"],
            "estimatedSetup": "3-4 days",
            "criteria_count": 15
        }
    ]

    for s in standards_data:
        print(f"Seeding {s['title']}...")
        standard = await db.standard.create(
            data={
                "id": s["id"],
                "title": s["title"],
                "code": s["code"],
                "category": s["category"],
                "description": s["description"],
                "region": s["region"],
                "icon": s["icon"],
                "color": s["color"],
                "features": s["features"],
                "estimatedSetup": s["estimatedSetup"]
            }
        )
        
        # Create dummy criteria based on count
        for i in range(1, s["criteria_count"] + 1):
            await db.criterion.create(
                data={
                    "standardId": standard.id,
                    "title": f"Criterion {i}",
                    "description": f"Detailed requirement for {s['title']} Criterion {i}"
                }
            )

    await db.disconnect()
    print("Seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
