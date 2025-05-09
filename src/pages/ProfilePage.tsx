import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface Bucket {
  id: string;
  name: string;
  prompt: string;
  created_at: string;
}

const ProfileBuckets = () => {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBuckets = async () => {
      const { data, error } = await supabase
        .from("buckets")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching buckets:", error);
        return;
      }
      setBuckets(data);
    };

    fetchBuckets();
  }, []);

  const handleBucketSelect = (bucketId: string) => {
    navigate("/chat", { state: { selectedBucketId: bucketId } });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {buckets.map((bucket) => (
        <div
          key={bucket.id}
          className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
          onClick={() => handleBucketSelect(bucket.id)}
        >
          <h3 className="text-xl font-bold mb-2">{bucket.name}</h3>
          <p className="text-gray-600 text-sm line-clamp-3">{bucket.prompt}</p>
        </div>
      ))}
    </div>
  );
};

export default ProfileBuckets;
