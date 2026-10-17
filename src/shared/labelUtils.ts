// Copyright 2000-2024 JetBrains s.r.o. and contributors. Use of this source code is governed by the Apache 2.0 license.
// Aligned with platform/vcs-log/impl/src/com/intellij/vcs/log/ui/render/LabelPainter.java

export const MAX_LABEL_LENGTH = 22;

export type RefType = 'head' | 'branch' | 'remote' | 'tag';

export interface ParsedRef {
  raw: string;
  type: RefType;
  displayName: string;
  shortName: string;
}

/**
 * Shortens long reference names with '..' when exceeding maxLength (default 22).
 * Follows IntelliJ IDEA LabelPainter truncation rules.
 */
export function shortenRefName(name: string, maxLength: number = MAX_LABEL_LENGTH): string {
  if (!name || name.length <= maxLength) {
    return name;
  }

  const slashIndex = name.indexOf('/');
  if (slashIndex > 0 && slashIndex < maxLength - 6) {
    const prefix = name.slice(0, slashIndex + 1);
    const rest = name.slice(slashIndex + 1);
    const avail = maxLength - prefix.length - 2;
    if (avail >= 4) {
      const half = Math.floor(avail / 2);
      return `${prefix}${rest.slice(0, half)}..${rest.slice(-half)}`;
    }
  }

  const keep = Math.floor((maxLength - 2) / 2);
  return `${name.slice(0, keep)}..${name.slice(-keep)}`;
}

/**
 * Parses raw git log ref decoration string into structured ParsedRef.
 */
export function parseRef(ref: string): ParsedRef {
  if (ref.startsWith('tag: ')) {
    const displayName = ref.slice(5);
    return {
      raw: ref,
      type: 'tag',
      displayName,
      shortName: shortenRefName(displayName)
    };
  }

  if (ref.startsWith('HEAD -> ')) {
    const displayName = ref.slice(8);
    return {
      raw: ref,
      type: 'head',
      displayName,
      shortName: shortenRefName(displayName)
    };
  }

  if (ref === 'HEAD') {
    return {
      raw: ref,
      type: 'head',
      displayName: 'HEAD',
      shortName: 'HEAD'
    };
  }

  if (ref.includes('/')) {
    return {
      raw: ref,
      type: 'remote',
      displayName: ref,
      shortName: shortenRefName(ref)
    };
  }

  return {
    raw: ref,
    type: 'branch',
    displayName: ref,
    shortName: shortenRefName(ref)
  };
}
