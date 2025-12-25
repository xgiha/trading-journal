
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// Cast motion elements to any to bypass environment-specific type definition issues
const MotionPath = motion.path as any;

interface PerformanceRadarProps {
  data: { subject: string; A: number; fullMark: number }[];
}

// --- Spline / Curve Logic ---
const getControlPoints = (
  p0: {x: number, y: number}, 
  p1: {x: number, y: number}, 
  p2: {x: number, y: number}, 
  t: number = 0.2
) => {
  const d01 = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));
  const d12 = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  
  const fa = t * d01 / (d01 + d12 || 1);
  const fb = t * d12 / (d01 + d12 || 1);
  
  const cp1x = p1.x - fa * (p2.x - p0.x);
  const cp1y = p1.y - fa * (p2.y - p0.y);
  const cp2x =