import Image from "next/image";

export default function AutomationCard({ automation }) {
  const { name, description, price, image, link } = automation;

  return (
    <article className="flex flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-lg shadow-purple-900/20 hover:border-purple-500/40 transition">
      <div className="relative w-full h-40 rounded-xl overflow-hidden mb-4 bg-black/20">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <h3 className="text-xl font-semibold text-white mb-1">{name}</h3>
      <p className="text-sm text-gray-300 flex-1 mb-4">{description}</p>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-2xl font-bold text-purple-300">{price}</span>
          <p className="text-xs text-gray-400 uppercase tracking-wide">One-time</p>
        </div>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-purple-500/30 transition text-center"
        >
          Activate
        </a>
      </div>
    </article>
  );
}

