# Campus Data Manager

## Purpose

Manage Students, Courses, and Library records independently from one workspace. This first version uses dummy data and three local SQLite files.

## Core workflow

Select a database, view and search records, open an add or edit form, validate and save, then see the updated table. Deletion requires confirmation. Errors and loading states must be visible.

## Data

- Students: ID, name, email, programme, study year. Start with 15 records.
- Courses: ID, course code, title, credits, lecturer. Start with 12 records.
- Library books: ID, title, author, ISBN, available copies. Start with 20 records.

Each database owns its connection and queries. Changes survive restarts and do not alter another database. Dummy-data setup is repeatable.

## Stack

Web application using Next.js App Router, TypeScript, server Route Handlers, and SQLite. Use the installed shadcn Base UI components.

## Visual preference

The user selected a neutral shadcn workspace. Retain the starter's neutral palette, Inter font, and shared component styling.

## Scope

Local demo. Authentication, deployment, cross-database joins, borrowing workflows, and student-course enrolment are outside this first version.
