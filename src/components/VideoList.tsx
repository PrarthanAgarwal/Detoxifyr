import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { VideoMetadata } from '../types';
import LoadingSpinner from './ui/LoadingSpinner';
import SkeletonLoader from './ui/SkeletonLoader';
import ErrorMessage from './ui/ErrorMessage';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { selectCurrentVideos, selectSessionStatus } from '../store/sessionSlice';

const VIDEOS_PER_PAGE = 10;

const VideoList: React.FC = () => {
	const videos = useSelector(selectCurrentVideos);
	const { loading, error } = useSelector(selectSessionStatus);
	const isOnline = useNetworkStatus();

	const [page, setPage] = useState(1);
	const [displayedVideos, setDisplayedVideos] = useState<VideoMetadata[]>([]);
	const observerTarget = useRef<HTMLDivElement>(null);

	const totalVideos = videos.length;
	const hasMoreVideos = totalVideos > displayedVideos.length;

	useEffect(() => {
		if (videos) {
			setDisplayedVideos(
				videos.slice(0, page * VIDEOS_PER_PAGE)
			);
		}
	}, [videos, page]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			entries => {
				if (entries[0].isIntersecting && hasMoreVideos) {
					setPage(prev => prev + 1);
				}
			},
			{ threshold: 0.5 }
		);

		if (observerTarget.current) {
			observer.observe(observerTarget.current);
		}

		return () => observer.disconnect();
	}, [hasMoreVideos]);

	const renderVideo = (video: VideoMetadata) => (
		<div key={video.videoId} className="mb-4 p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
			{!isOnline ? (
				<div className="aspect-video bg-gray-100 flex items-center justify-center rounded-lg">
					<p className="text-gray-500">Thumbnail unavailable offline</p>
				</div>
			) : (
				<img
					src={video.thumbnailUrl}
					alt={video.title}
					className="w-full h-40 object-cover rounded-lg mb-2"
					onError={(e) => {
						e.currentTarget.src = '/placeholder-thumbnail.png';
					}}
				/>
			)}
			<h3 className="font-medium mb-1 line-clamp-2">{video.title}</h3>
			<p className="text-sm text-gray-600 mb-2">{video.channelTitle}</p>
			<div className="flex items-center text-sm text-gray-500 space-x-2">
				<span>{video.viewCount.toLocaleString()} views</span>
				<span>•</span>
				<span>Quality: {video.contentQualityScore.toFixed(2)}</span>
			</div>
		</div>
	);

	if (error) {
		return (
			<div className="p-4">
				<ErrorMessage 
					message={error}
					onRetry={() => setPage(1)}
				/>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="p-4 space-y-4">
				<h2 className="text-xl font-semibold mb-4">Loading Videos</h2>
				<LoadingSpinner />
				<SkeletonLoader 
					count={3} 
					className="h-40 mb-4"
				/>
			</div>
		);
	}

	if (!videos.length) {
		return (
			<div className="p-4 text-center">
				<h2 className="text-xl font-semibold mb-4">No Videos Found</h2>
				<p className="text-gray-600">
					Try adjusting your preferences to see more videos.
				</p>
			</div>
		);
	}

	return (
		<div className="p-4">
			<h2 className="text-xl font-semibold mb-4">
				Curated Videos ({displayedVideos.length} of {totalVideos})
			</h2>
			
			<div className="space-y-4">
				{displayedVideos.map(renderVideo)}
				
				{hasMoreVideos && (
					<>
						<div className="my-4">
							<SkeletonLoader 
								count={2}
								className="h-40 mb-4"
							/>
						</div>
						<div ref={observerTarget} className="h-4" />
					</>
				)}
			</div>
		</div>
	);
};

export default VideoList;