"use client";

import React from "react";
import Link from "next/link";
import { FaCog, FaHeart, FaUsers } from "react-icons/fa";
import { useTranslation } from "./LanguageProvider";

interface WelcomePostProps {
  userName?: string;
}

export default function WelcomePost({ userName }: WelcomePostProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-br from-primary-dark to-primary/10 rounded-lg shadow-lg p-6 mb-4 border-2 border-accent/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-primary-dark rounded-full flex items-center justify-center">
          <FaHeart className="text-white text-xl" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-secondary-dark">
            {t("welcome.title")}
          </h3>
          <p className="text-sm text-secondary">
            {userName
              ? t("welcome.personalGreeting", { name: userName })
              : t("welcome.genericGreeting")}
          </p>
        </div>
      </div>

      <div className="bg-primary-dark rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-secondary-dark mb-2 flex items-center gap-2">
          <FaUsers className="text-accent" />
          {t("welcome.howItWorks")}
        </h4>
        <p className="text-secondary-dark/80 text-sm leading-relaxed mb-3">
          {t("welcome.explanation")}
        </p>

        <div className="bg-primary-dark rounded-lg p-3 border border-accent/30">
          <p className="font-medium text-secondary-dark mb-2">
            {t("welcome.getStarted")}
          </p>
          <Link
            href="/settings/interests"
            className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors font-medium text-sm"
          >
            <FaCog />
            {t("welcome.selectInterests")}
          </Link>
        </div>
      </div>

      <div className="text-xs text-secondary-dark/60 text-center">
        {t("welcome.footerNote")}
      </div>
    </div>
  );
}
