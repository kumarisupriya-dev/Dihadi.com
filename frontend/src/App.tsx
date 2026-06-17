import {Briefcase} from "lucide-react";

function App(){
  return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Briefcase className="w-16 h-16 text-brand-500 animate-bounce"/>
        <h1 className="text-4xl font-black tracking-tight text-white">Dihadi.com</h1>
        <p className="text-slate-400 text-lg">Your Errands, Your Earnings.</p>
      </div>
  );
}
export default App;