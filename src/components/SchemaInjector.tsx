import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'wouter';

interface SchemaInjectorProps {
  schemaData: any;
  type?: 'breadcrumb' | 'article' | 'video' | 'organization' | 'website';
}

export const SchemaInjector: React.FC<SchemaInjectorProps> = ({ schemaData, type = 'website' }) => {
  const [location] = useLocation();

  if (!schemaData) return null;

  // Add the current URL dynamically if not present in schema
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://laksub.com';
  const enhancedSchema = {
    ...schemaData,
    url: schemaData.url || `${baseUrl}${location}`
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(enhancedSchema)}
      </script>
    </Helmet>
  );
};
