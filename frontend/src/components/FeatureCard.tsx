import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
export function FeatureCard({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return <motion.article className="feature-card" whileHover={{ y: -6 }} transition={{ duration: .2 }}><span className="icon-box"><Icon size={24} /></span><h3>{title}</h3><p>{text}</p></motion.article>;
}
