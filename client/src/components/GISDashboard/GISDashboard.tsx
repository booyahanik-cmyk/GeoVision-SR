import React from 'react';
import { AreaOfInterest, Parcel, ScreenType } from '../../types';
import { GISDashboardPage } from './GISDashboardPage';

export interface GISDashboardProps {
  activeAOI: AreaOfInterest;
  aoiList?: AreaOfInterest[];
  onSelectAOI: (aoi: AreaOfInterest) => void;
  onAddCustomAOI?: (customAOI: AreaOfInterest) => void;
  onSelectScreen: (screen: ScreenType) => void;
  selectedParcel: Parcel | null;
  onSelectParcel: (parcel: Parcel | null) => void;
  initialSelectedImageryId?: number | null;
}

export const GISDashboard: React.FC<GISDashboardProps> = (props) => {
  return <GISDashboardPage {...props} />;
};

export { GISDashboardPage };
