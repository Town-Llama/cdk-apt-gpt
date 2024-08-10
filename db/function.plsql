CREATE OR REPLACE FUNCTION search_properties_with_embeddings(
    min_rent NUMERIC,
    max_rent NUMERIC,
    bedrooms INTEGER,
    input_lat NUMERIC,
    input_lng NUMERIC,
    max_distance NUMERIC,
    embedding_vector vector
)
RETURNS TABLE (
    unit_id character varying,
    property_id character varying,
    property_ts timestamp without time zone,
    available BOOLEAN,
    name TEXT,
    baths NUMERIC,
    beds INTEGER,
    area INTEGER,
    ts TIMESTAMP,
    rent_12_month_monthly NUMERIC,
    rent_11_month_monthly NUMERIC,
    rent_10_month_monthly NUMERIC,
    rent_9_month_monthly NUMERIC,
    rent_8_month_monthly NUMERIC,
    rent_7_month_monthly NUMERIC,
    rent_6_month_monthly NUMERIC,
    rent_5_month_monthly NUMERIC,
    rent_4_month_monthly NUMERIC,
    rent_3_month_monthly NUMERIC,
    rent_2_month_monthly NUMERIC,
    rent_1_month_monthly NUMERIC,
    property_timestamp timestamp without time zone,
    addressStreet character varying,
    addressCity character varying,
    addressState character varying,
    addressZipCode character varying,
    latitude NUMERIC,
    longitude NUMERIC,
    photosArray TEXT,
    description TEXT,
    transitScore INTEGER,
    transitDescription TEXT,
    walkScore INTEGER,
    walkDescription TEXT,
    buildingName character varying,
    distance double precision,
    embedding_similarity NUMERIC
)
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_units AS (
        SELECT u.id AS unit_id, u.property_id, u.property_ts, u.available, u.name, u.baths, u.beds, u.area, u.ts,
               u.rent_12_month_monthly, u.rent_11_month_monthly, u.rent_10_month_monthly, u.rent_9_month_monthly,
               u.rent_8_month_monthly, u.rent_7_month_monthly, u.rent_6_month_monthly, u.rent_5_month_monthly,
               u.rent_4_month_monthly, u.rent_3_month_monthly, u.rent_2_month_monthly, u.rent_1_month_monthly,
               p.timestamp AS property_timestamp, p.addressStreet, p.addressCity, p.addressState, p.addressZipCode,
               p.latitude, p.longitude, p.photosArray, p.description, p.transitScore, p.transitDescription,
               p.walkScore, p.walkDescription, p.buildingName,
               calculate_distance(p.latitude, p.longitude, input_lat, input_lng) AS distance
        FROM Unit u
        JOIN Properties p ON u.property_id = p.id AND u.property_ts = p.timestamp
        WHERE u.rent_12_month_monthly BETWEEN min_rent AND max_rent
          AND u.beds = bedrooms
          AND calculate_distance(p.latitude, p.longitude, input_lat, input_lng) < max_distance
    )
    SELECT fu.*,
           MIN((e.data <-> embedding_vector)::DECIMAL(9, 6)) AS embedding_similarity
    FROM filtered_units fu
    JOIN Photos ph ON fu.property_id = ph.entityid
    JOIN embeddings e ON ph.id = e.photo_id
    GROUP BY fu.unit_id, fu.property_id, fu.property_ts, fu.available, fu.name, fu.baths, fu.beds, fu.area, fu.ts,
             fu.rent_12_month_monthly, fu.rent_11_month_monthly, fu.rent_10_month_monthly, fu.rent_9_month_monthly,
             fu.rent_8_month_monthly, fu.rent_7_month_monthly, fu.rent_6_month_monthly, fu.rent_5_month_monthly,
             fu.rent_4_month_monthly, fu.rent_3_month_monthly, fu.rent_2_month_monthly, fu.rent_1_month_monthly,
             fu.property_timestamp, fu.addressStreet, fu.addressCity, fu.addressState, fu.addressZipCode,
             fu.latitude, fu.longitude, fu.photosArray, fu.description, fu.transitScore, fu.transitDescription,
             fu.walkScore, fu.walkDescription, fu.buildingName, fu.distance
    ORDER BY embedding_similarity;
END;
$$ LANGUAGE plpgsql;