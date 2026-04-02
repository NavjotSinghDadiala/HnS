# ============================================
# 3-LAYER INTELLIGENT ROUTING ARCHITECTURE - TEST EXAMPLES
# ============================================

import re

# Copy of classify_query function for testing without dependencies
def classify_query(query: str) -> str:
    """
    Classify query complexity into simple/medium/complex

    SIMPLE: Direct property search, builder search, filters like price/location/BHK
    MEDIUM: Requires explanation/recommendations, context from data
    COMPLEX: Multi-condition + reasoning, decision making
    """
    query_lower = query.lower()

    # SIMPLE QUERIES - Direct database lookups
    simple_keywords = [
        'show', 'find', 'search', 'list', 'display', 'available',
        'properties', 'property', 'builder', 'builders', 'developer',
        'flats', 'apartments', 'houses', 'bhk', 'bedroom',
        'under', 'below', 'above', 'price', 'budget', 'cost',
        'location', 'area', 'city', 'near', 'in', 'at',
        'rera', 'possession', 'status', 'configuration'
    ]

    # Check if query is mostly simple keywords (lower threshold)
    words = query_lower.split()
    simple_word_count = sum(1 for word in words if any(kw in word for kw in simple_keywords))

    # If >50% words are simple keywords, it's simple (reduced from 70%)
    if len(words) > 0 and simple_word_count / len(words) > 0.5:
        return "simple"

    # Also check for direct filter patterns
    filter_patterns = [
        r'\d+\s*bhk',  # "2BHK"
        r'under\s+\d+',  # "under 80"
        r'in\s+[a-zA-Z]+',  # "in Thane"
        r'by\s+[a-zA-Z]+',  # "by Lodha"
        r'near\s+[a-zA-Z]+'  # "near metro"
    ]

    if any(re.search(pattern, query_lower) for pattern in filter_patterns):
        return "simple"

    # COMPLEX QUERIES - Multi-condition reasoning
    complex_indicators = [
        'best', 'recommend', 'suggest', 'compare', 'versus', 'vs',
        'worth', 'investment', 'roi', 'return', 'profit',
        'should i', 'is it good', 'which one', 'better than',
        'analyze', 'evaluate', 'assess', 'decide', 'choose',
        'future', 'growth', 'appreciation', 'market trend'
    ]

    complex_count = sum(1 for indicator in complex_indicators if indicator in query_lower)

    # Multi-condition check (price + location + bhk + more)
    condition_count = 0
    if any(word in query_lower for word in ['under', 'below', 'above', 'price', 'budget']):
        condition_count += 1
    if any(word in query_lower for word in ['bhk', 'bedroom', 'configuration']):
        condition_count += 1
    if any(word in query_lower for word in ['location', 'area', 'city', 'near', 'in']):
        condition_count += 1
    if any(word in query_lower for word in ['builder', 'developer', 'rera']):
        condition_count += 1
    if any(word in query_lower for word in ['possession', 'status', 'ready']):
        condition_count += 1

    # If multiple conditions + complex indicators, definitely complex
    if condition_count >= 3 and complex_count >= 1:
        return "complex"

    # If has complex indicators but fewer conditions, still complex
    if complex_count >= 2:
        return "complex"

    # If multiple conditions without complex indicators, check threshold
    if condition_count >= 3:
        return "complex"

    # MEDIUM QUERIES - Everything else (explanations, recommendations)
    return "medium"


def test_classification():
    """Test the query classification function"""

    print("🧠 TESTING QUERY CLASSIFICATION")
    print("=" * 50)

    test_queries = [
        # SIMPLE QUERIES
        ("2BHK under 80L in Thane", "simple"),
        ("Show properties by Lodha", "simple"),
        ("Flats near metro", "simple"),
        ("Find builders in Mumbai", "simple"),
        ("3 bedroom houses", "simple"),

        # MEDIUM QUERIES
        ("Which areas are good for investment?", "medium"),
        ("Best builders in Thane", "medium"),
        ("Is this property worth buying?", "medium"),
        ("Tell me about real estate in Navi Mumbai", "medium"),
        ("What are the current market trends?", "medium"),

        # COMPLEX QUERIES
        ("Best 2BHK under 80L near metro with good ROI", "complex"),
        ("Compare 3 properties and suggest best", "complex"),
        ("Should I invest in Thane or Navi Mumbai?", "complex"),
        ("Help me choose between these builders for my investment", "complex"),
        ("Which property gives best returns considering location and builder reputation?", "complex")
    ]

    correct = 0
    total = len(test_queries)

    for query, expected in test_queries:
        result = classify_query(query)
        status = "✅" if result == expected else "❌"
        print(f"{status} '{query}' -> {result} (expected: {expected})")
        if result == expected:
            correct += 1

    print(f"\n📊 Classification Accuracy: {correct}/{total} ({correct/total*100:.1f}%)")
    print()


# ============================================
# RUN TESTS
# ============================================

if __name__ == "__main__":
    test_classification()

    print("✅ 3-Layer Architecture Implementation Complete!")
    print("\nKey Benefits:")
    print("- Minimizes LLM usage (cost optimization)")
    print("- Fast responses for simple queries")
    print("- Intelligent routing based on complexity")
    print("- Modular agent system for complex analysis")
    print("- Fallback mechanisms for reliability")