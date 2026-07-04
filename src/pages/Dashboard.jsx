import React from 'react';
import { Navigate } from 'react-router-dom';
import FounderDashboard from './dashboards/FounderDashboard';
import VCDashboard from './dashboards/VCDashboard';
import InstitutionDashboard from './dashboards/InstitutionDashboard';

export default function Dashboard({ founderProfile, user, openAuthModal, currentReport, setCurrentReport }) {
 if (!founderProfile) return <Navigate to="/onboarding" replace />;

 if (founderProfile.role === 'vc') {
 return <VCDashboard founderProfile={founderProfile} user={user} />;
 }
 
 if (founderProfile.role === 'institution' || founderProfile.role === 'government') {
 return <InstitutionDashboard founderProfile={founderProfile} user={user} />;
 }

 return (
 <FounderDashboard 
 founderProfile={founderProfile} 
 user={user} 
 openAuthModal={openAuthModal}
 currentReport={currentReport}
 setCurrentReport={setCurrentReport}
 />
);
}
