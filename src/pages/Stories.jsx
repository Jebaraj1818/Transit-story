import React, { useState, useEffect } from 'react';
import SectionHeading from '../components/SectionHeading';
import StoryCard from '../components/StoryCard';
import { SAMPLE_STORIES } from '../data/stories';
import { getStories } from '../api/client';

export default function Stories() {
  const [stories, setStories] = useState(SAMPLE_STORIES);

  useEffect(() => {
    let isMounted = true;
    getStories().then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setStories(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Editorial & Notes"
          title="Field Stories"
          description="Reflections, oral histories, craft chronicles, and field dispatches from our journeys."
          align="left"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story) => (
            <StoryCard key={story.id || story.slug} {...story} />
          ))}
        </div>

        <div className="mt-16 p-6 bg-[#FAF7F0] border border-[#E3DCBF] rounded-sm text-center">
          <p className="text-xs text-charcoal-muted tracking-editorial uppercase font-medium">
            [Sample field stories for development & layout demonstration. Final publications curated directly with editorial team.]
          </p>
        </div>
      </div>
    </div>
  );
}
