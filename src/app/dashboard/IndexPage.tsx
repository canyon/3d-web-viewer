import { useState } from "react";
import Page from "@/app/dashboard/page";
import Component from "@/app/dashboard/next-blocks";

function IndexPage() {
  const [showPage2, setShowPage2] = useState(false);

  return (
    <div className="w-full h-screen bg-gray-900">
      {showPage2 ? <Page /> : <Component onNavigate={() => setShowPage2(true)} />}
    </div>
  );
}

export default IndexPage;
