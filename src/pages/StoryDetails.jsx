import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStoryBySlug as getLocalStoryBySlug } from '../data/stories';
import { getStoryBySlug } from '../api/client';
import Button from '../components/Button';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';

export default function StoryDetails() {
  const { slug } = useParams();
  const [story, setStory] = useState(() => getLocalStoryBySlug(slug));

  useEffect(() => {
    let isMounted = true;
    getStoryBySlug(slug).then((data) => {
      if (isMounted && data && data.title) {
        setStory(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (!story) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h2 className="font-serif text-3xl font-semibold text-forest mb-4">Story Not Found</h2>
        <p className="text-charcoal-muted mb-8">
          The requested field story with identifier "{slug}" could not be found.
        </p>
        <Button to="/stories" variant="primary">
          Back to all stories
        </Button>
      </div>
    );
  }

  return (
    <article className="py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          to="/stories"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-charcoal-light hover:text-forest transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Stories</span>
        </Link>

        {/* Story Header */}
        <header className="mb-10">
          <span className="text-xs uppercase tracking-widest font-semibold text-earth mb-3 block">
            {story.category}
          </span>
          <h1 className="font-serif text-[clamp(1.85rem,5vw,2.25rem)] sm:text-4xl md:text-5xl font-semibold text-forest leading-tight mb-6">
            {story.title}
          </h1>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-charcoal-light border-y border-ivory-200 py-3">
            {story.date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gold" />
                <span>{story.date}</span>
              </div>
            )}
            {story.readTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gold" />
                <span>{story.readTime}</span>
              </div>
            )}
            {story.author && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gold" />
                <span>{story.author}</span>
              </div>
            )}
          </div>
        </header>

        {/* Featured Image */}
        <div className="aspect-[16/10] w-full overflow-hidden rounded-sm bg-forest/10 mb-10">
          <img
            src={story.image}
            alt={story.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Editorial Content */}
        <div className="prose prose-lg max-w-none text-charcoal leading-relaxed space-y-6">
          <p className="font-serif text-xl sm:text-2xl text-forest/90 italic leading-relaxed border-l-2 border-gold pl-6 my-6">
            "{story.excerpt}"
          </p>
          <p className="text-base sm:text-lg leading-relaxed text-charcoal-muted">
            {story.content}
          </p>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-ivory-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <Link
            to="/stories"
            className="text-xs uppercase tracking-widest font-semibold text-forest hover:text-earth py-2"
          >
            &larr; More Stories
          </Link>
          <Button to="/plan-your-journey" variant="outline" size="sm" className="w-full sm:w-auto">
            Plan a Journey
          </Button>
        </div>
      </div>
    </article>
  );
}
