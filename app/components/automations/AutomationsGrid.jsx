import AutomationCard from "./AutomationCard";

const MOCK_AUTOMATIONS = [
  {
    id: "social-media-automation",
    name: "Social Media Automation",
    description: "Automate your social media with just one click, TikTok to YouTube.",
    price: "$0.00",
    image: "/Screenshot 2025-11-17 at 17.23.06.png",
    link: "https://app.modelgrow.com/",
  },
];

export default function AutomationsGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {MOCK_AUTOMATIONS.map((automation) => (
        <AutomationCard key={automation.id} automation={automation} />
      ))}
    </div>
  );
}

