package com.resolveiq.repository;

import com.resolveiq.entity.Category;
import com.resolveiq.entity.Incident;
import com.resolveiq.entity.IncidentStatus;
import com.resolveiq.entity.Priority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, String> {

    List<Incident> findByStatus(IncidentStatus status);

    List<Incident> findByPriority(Priority priority);

    List<Incident> findByCategory(Category category);

    List<Incident> findByReporterEmail(String reporterEmail);

    List<Incident> findByAssigneeEmail(String assigneeEmail);

    @Query("SELECT i FROM Incident i WHERE " +
           "(:status IS NULL OR i.status = :status) AND " +
           "(:priority IS NULL OR i.priority = :priority) AND " +
           "(:category IS NULL OR i.category = :category) AND " +
           "(:service IS NULL OR LOWER(i.serviceName) = LOWER(:service)) AND " +
           "(:search IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.description) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.id) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY i.createdAt DESC")
    List<Incident> searchIncidents(
            @Param("status") IncidentStatus status,
            @Param("priority") Priority priority,
            @Param("category") Category category,
            @Param("service") String service,
            @Param("search") String search
    );

    long countByStatus(IncidentStatus status);

    long countByPriorityAndStatusNot(Priority priority, IncidentStatus status);
}
