package com.resolveiq.repository;

import com.resolveiq.entity.IncidentComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentCommentRepository extends JpaRepository<IncidentComment, String> {

    List<IncidentComment> findByIncidentIdOrderByCreatedAtAsc(String incidentId);
}
