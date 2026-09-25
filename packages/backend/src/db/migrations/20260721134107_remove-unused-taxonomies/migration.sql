-- Custom SQL migration file, put your code below! --
DELETE
FROM "taxonomies"
WHERE taxonomy_type IN ('activities_of_interest', 'cybersecurity_research_projects', 'european_cybersecurity_competenc',
                       'funding_sources', 'initiatives', 'legal_status', 'position_category');
