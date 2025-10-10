'use client'

import Image from 'next/image'
import React from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'

const CUSTOM_COLORS = [
  'border-black/60',    // Circle 0
  'border-blue-600/50', // Circle 1
  'border-sky-400/40',  // Circle 2
  'border-gray-400/30'  // Circle 3 
]

const AnimatedGrid = () => (
  <motion.div
    className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black)]"
    animate={{
      backgroundPosition: ['0% 0%', '100% 100%'],
    }}
    transition={{
      duration: 40,
      repeat: Number.POSITIVE_INFINITY,
      ease: 'linear',
    }}
  >
    <div className="h-full w-full [background-image:repeating-linear-gradient(100deg,#64748B_0%,#64748B_1px,transparent_1px,transparent_4%)] opacity-20" />
  </motion.div>
)

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="relative flex flex-col justify-center min-h-screen p-4 sm:p-8 pb-20 font-[family-name:var(--font-geist-sans)] bg-white dark:bg-black/5 overflow-hidden pt-6 md:pt-16 items-center">
      <AnimatedGrid />

      {/* Circles with logo in the center */}
      <motion.div className="relative h-[280px] w-[280px] sm:h-[380px] sm:w-[380px] md:h-[480px] md:w-[480px] flex items-center justify-center">
        {CUSTOM_COLORS.map((borderClass, i) => (
          <motion.div
            key={i}
            className={clsx(
              'absolute inset-0 rounded-full border-2',
              borderClass
            )}
            animate={{
              rotate: 360,
              scale: [1, 1.05 + i * 0.03, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 6 + i * 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
            }}
          >
            {/* Blue gradient inside the circle */}
            <div
              className={clsx(
                'absolute inset-0 rounded-full mix-blend-screen',
                'bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.2),transparent_70%)]'
              )}
            />
          </motion.div>
        ))}

        {/* Logo centered inside the circles */}
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Image
            src="/logo_add.png"
            alt="Logo"
            width={80}
            height={80}
            className="sm:w-[120px] sm:h-[120px] md:w-[150px] md:h-[150px]"
            priority
          />
        </motion.div>
      </motion.div>

      {/* Dashboard button for logged-in users */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative z-10 mt-16"
        >
          <Link href="/dashboard" className="px-6 py-2 sm:px-8 sm:py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base">
            Accéder au tableau de bord
          </Link>
        </motion.div>
      )}

      {/* Radial blur background */}
      <div className="absolute inset-0 [mask-image:radial-gradient(90%_60%_at_50%_50%,#000_40%,transparent)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0F766E/30%,transparent_70%)] blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#2DD4BF/15%,transparent)] blur-[80px]" />
      </div>
    </div>
  )
}
