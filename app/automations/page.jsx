import UnifiedBackground from "@/app/components/shared/UnifiedBackground";
import AutomationsGrid from "@/app/components/automations/AutomationsGrid";

export default function AutomationsPage() {
  return (
    <UnifiedBackground variant="content" className="pt-16">
      <div className="pt-24 pb-12 px-6">
        <div className="mx-auto w-[90%] max-w-[1500px] min-h-[50vh] space-y-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
              Automations
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Quickly plug in ready-made automations to keep your workflows humming.
            </p>
          </div>
          <AutomationsGrid />
        </div>
      </div>
    </UnifiedBackground>
  );
}

