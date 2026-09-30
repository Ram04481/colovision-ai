import { Activity, Plus, ScanLine, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
export function Dashboard() { return <section className="section"><p className="eyebrow">USER DASHBOARD</p><h1>Welcome, Researcher</h1><div className="stat-grid"><div><UsersRound/> <b>0</b><span>Total patients</span></div><div><Activity/> <b>0</b><span>Total predictions</span></div><div><ScanLine/> <b>—</b><span>Recent analysis</span></div></div><Link className="button" to="/patients/new"><Plus size={18}/> Add patient</Link></section>; }
