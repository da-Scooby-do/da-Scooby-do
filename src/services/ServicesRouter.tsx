import { useState, useEffect } from 'react';
import ServiceCategoryPage from './components/ServiceCategoryPage';
import ServiceRequestForm from './components/ServiceRequestForm';
import ServiceRequestPage from './components/ServiceRequestPage';
import type { ServiceCategoryId } from './types';
import type { RequestType } from './components/ServiceRequestPage';

type Page = 'category' | 'request' | 'service-request';

interface Route {
  page: Page;
  categoryId?: ServiceCategoryId;
  preselectedService?: string;
  requestType?: RequestType;
}

function parseServicesHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean);

  if (parts[0] === 'services') {
    if (parts.length === 1) return { page: 'request' };
    if (parts[1] === 'request') {
      const queryStr = hash.split('?')[1];
      const params = new URLSearchParams(queryStr);
      const service = params.get('service') || undefined;
      return { page: 'request', preselectedService: service };
    }
    if (parts[1] === 'project-execution') return { page: 'service-request', requestType: 'project_execution' };
    if (parts[1] === 'contracting-works') return { page: 'service-request', requestType: 'contracting' };
    if (parts[1] === 'engineering-services') return { page: 'service-request', requestType: 'engineering' };
    if (parts[1] === 'project-management') return { page: 'service-request', requestType: 'project_management' };
    if (parts[1] === 'site-visit') return { page: 'service-request', requestType: 'site_visit' };
    return { page: 'category', categoryId: parts[1] as ServiceCategoryId };
  }

  return { page: 'request' };
}

export default function ServicesRouter() {
  const [route, setRoute] = useState<Route>(parseServicesHash());

  useEffect(() => {
    const onHashChange = () => setRoute(parseServicesHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <>
      {route.page === 'category' && route.categoryId && <ServiceCategoryPage categoryId={route.categoryId} />}
      {route.page === 'request' && <ServiceRequestForm preselectedService={route.preselectedService} />}
      {route.page === 'service-request' && route.requestType && <ServiceRequestPage requestType={route.requestType} />}
    </>
  );
}
