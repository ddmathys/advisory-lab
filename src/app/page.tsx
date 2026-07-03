import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Cpu,
  Database,
  FileText,
  LineChart,
  PieChart,
  Search,
  ShieldCheck,
} from "lucide-react";

// Page d'accueil — présente le parcours et la stack IA (support de cours HEG)

const STEPS = [
  {
    href: "/portfolio",
    icon: Briefcase,
    title: "1 · Portefeuille client",
    text: "Importez un relevé PDF (extraction par IA) ou chargez le portefeuille de démonstration, puis saisissez le profil d'investisseur.",
  },
  {
    href: "/portfolio/analyse",
    icon: PieChart,
    title: "2 · Analyse des avoirs",
    text: "Un agent « spécialiste en investissement » analyse concentration, risques et adéquation au profil, avec visualisations.",
  },
  {
    href: "/assets",
    icon: Search,
    title: "3 · Recherche d'assets",
    text: "Recherchez un titre via EODHD, consultez cours, fondamentaux et lancez l'analyse top-down avec consensus des analystes.",
  },
  {
    href: "/simulation",
    icon: LineChart,
    title: "4 · Portefeuille simulé",
    text: "Construisez une allocation cible et comparez-la au portefeuille actuel du client.",
  },
];

const STACK = [
  {
    icon: Cpu,
    title: "DeepSeek (LLM)",
    text: "Trois agents spécialisés : extraction de PDF, spécialiste investissement, analyste top-down. Appelé uniquement côté serveur.",
  },
  {
    icon: Database,
    title: "EODHD (données marché)",
    text: "Recherche d'instruments, cotations, historiques, fondamentaux et consensus analystes. Clé API protégée côté serveur.",
  },
  {
    icon: FileText,
    title: "Panneau « Sous le capot »",
    text: "Chaque analyse expose son prompt, le modèle, les tokens consommés et les sources de données : l'IA sans boîte noire.",
  },
  {
    icon: ShieldCheck,
    title: "Bonnes pratiques",
    text: "Aucune clé API dans le navigateur, données client stockées localement, l'IA reçoit des chiffres calculés — elle ne les invente pas.",
  },
];

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="pt-8 text-center">
        <p className="text-sage text-sm font-medium tracking-wide uppercase mb-3">
          Démonstration pédagogique — HEG
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-fg-0">
          L&apos;IA au service du<br className="hidden sm:block" /> conseiller financier
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-fg-2">
          Un outil opérationnel qui combine un LLM (DeepSeek) et des données de marché
          (EODHD) pour analyser un portefeuille client, évaluer une société et simuler
          une allocation — en montrant à chaque étape comment l&apos;IA travaille.
        </p>
        <div className="mt-8">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 bg-sage text-ink-0 font-medium px-5 py-2.5 rounded-lg hover:bg-sage-bright transition-colors"
          >
            Commencer avec un portefeuille
            <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-fg-1 mb-4">Le parcours conseiller</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {STEPS.map(({ href, icon: Icon, title, text }) => (
            <Link
              key={href}
              href={href}
              className="group bg-ink-2 border border-ink-3 rounded-xl p-5 hover:border-sage-dim transition-colors"
            >
              <Icon className="w-6 h-6 text-sage mb-3" aria-hidden />
              <h3 className="font-medium text-fg-0 group-hover:text-sage-bright transition-colors">
                {title}
              </h3>
              <p className="mt-1.5 text-sm text-fg-2">{text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-fg-1 mb-4">
          Sous le capot : les outils utilisés
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {STACK.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-ink-1 border border-ink-3 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-fg-2" aria-hidden />
                <h3 className="font-medium text-fg-0">{title}</h3>
              </div>
              <p className="text-sm text-fg-2">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
