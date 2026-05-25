import random
from abc import ABC, abstractmethod

class BaseAIService(ABC):
    @abstractmethod
    def generate_caption(self, prompt: str, style: str = "futuristic") -> str:
        pass

    @abstractmethod
    def generate_bio(self, profession: str, interests: list) -> str:
        pass

    @abstractmethod
    def scan_for_toxicity(self, text: str) -> dict:
        pass


class MockAIService(BaseAIService):
    def generate_caption(self, prompt: str, style: str = "futuristic") -> str:
        styles = {
            "futuristic": [
                f"🚀 Entering the digital stratosphere with {prompt}. #Nexora #FutureVibes",
                f"⚡ Quantum nodes aligned. Projecting: {prompt}. #TechDecentralized",
                f"🪐 Floating in obsidian dimensions of {prompt}. Built for the next era."
            ],
            "premium": [
                f"✨ Luxury redesigned. Experiencing the finer details of {prompt}.",
                f"💎 Premium states of mind. Reflecting on {prompt}.",
                f"🌌 High fidelity interactions, curated perfectly. {prompt}."
            ],
            "casual": [
                f"Just standard cyber things: {prompt}. 🤖",
                f"Chilling in the neon matrix with {prompt}...",
                f"Matrix reload: {prompt}."
            ]
        }
        selected_style = styles.get(style, styles["futuristic"])
        return random.choice(selected_style)

    def generate_bio(self, profession: str, interests: list) -> str:
        interest_str = ", ".join(interests) if interests else "cybernetics"
        bios = [
            f"🌌 Professional {profession} mapping the digital grid. Navigating: {interest_str}. Built different inside Nexora.",
            f"⚡ {profession} || Architecting future solutions. Obsessed with: {interest_str}. Living in the quantum timeline. 🪐",
            f"✨ Deeply immersed as a {profession}. Creating glassmorphic universes centered around {interest_str}."
        ]
        return random.choice(bios)

    def scan_for_toxicity(self, text: str) -> dict:
        toxic_keywords = ["bad", "hate", "dumb", "kill", "toxic", "spam", "abuse"]
        is_toxic = any(word in text.lower() for word in toxic_keywords)
        confidence = random.uniform(0.85, 0.99) if is_toxic else random.uniform(0.01, 0.15)
        
        return {
            "is_toxic": is_toxic,
            "confidence": round(confidence, 4),
            "label": "TOXIC" if is_toxic else "SAFE",
            "message": "Content flagged by Nexora AI Moderation protocols." if is_toxic else "Content safe."
        }


# Global singleton provider that can be hot-swapped for OpenAI/Gemini easily!
ai_service = MockAIService()
