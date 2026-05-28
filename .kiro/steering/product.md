# HED AD — Digital Signage Platform

## What It Is

HED AD is a digital signage management platform for Hospital Ernesto Dornelles (Porto Alegre, Brazil). It turns hospital TVs into a managed advertising channel where commercial partners create ad campaigns, hospital admins approve and control inventory, and TVs automatically display a carousel of ads organized by shift, weekday, and location.

## Core Concepts

- **Inventory model**: Each shift (Manhã, Tarde, Noite, Madrugada) has 300 seconds of commercial inventory per TV per weekday. Institutional campaigns fill remaining time automatically.
- **User roles**: `ADMIN_HED` (hospital staff managing campaigns/users) and `PARCEIRO` (commercial partners creating campaigns).
- **TV Player**: Mini-PCs authenticate via revocable UUID tokens and poll the API for their playlist filtered by current shift, weekday, and TV location.
- **Campaign lifecycle**: EM_ANALISE → APROVADA → ATIVA → EXPIRADA (or PAUSADA at any point by admin).

## Language

All UI text, model labels, API messages, and documentation are in **Brazilian Portuguese (pt-BR)**. Code identifiers (variable names, function names) mix Portuguese domain terms with English programming conventions.
